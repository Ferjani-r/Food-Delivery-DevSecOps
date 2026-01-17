pipeline {
  agent {
    docker {
      image 'docker:27-cli'
      args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  environment {
    DOCKER_BUILDKIT = "1"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          docker run --rm \
            --volumes-from $(docker ps -qf "name=jenkins") \
            -w /var/jenkins_home/workspace/food-delivery-devsecops/backend \
            node:18-alpine npm install

          docker run --rm \
            --volumes-from $(docker ps -qf "name=jenkins") \
            -w /var/jenkins_home/workspace/food-delivery-devsecops/frontend \
            node:18-alpine npm install
        '''
      }
    }

    stage('SAST - SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh '''
            docker run --rm \
              -e SONAR_HOST_URL=$SONAR_HOST_URL \
              -e SONAR_TOKEN=$SONAR_AUTH_TOKEN \
              -v /var/jenkins_home/workspace/food-delivery-devsecops:/usr/src \
              -w /usr/src \
              sonarsource/sonar-scanner-cli:latest \
              -Dsonar.host.url=$SONAR_HOST_URL \
              -Dsonar.login=$SONAR_TOKEN \
              -Dsonar.projectKey=food-delivery \
              -Dsonar.projectName="Food Delivery App" \
              -Dsonar.projectVersion=1.0 \
              -Dsonar.sources=. \
              -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
          '''
        }
      }
    }

    stage('Dependency Audit') {
      steps {
        sh '''
          docker run --rm \
            -v $(pwd):/app \
            -w /app \
            node:18-alpine \
            sh -c "ls -la scripts/ && sh ./scripts/security-audit.sh"
        '''
      }
    }

    stage('Tests & Coverage') {
      steps {
        sh '''
          docker run --rm -v $(pwd)/backend:/app -w /app node:18-alpine npm test -- --coverage
          docker run --rm -v $(pwd)/frontend:/app -w /app node:18-alpine npm test -- --coverage
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
          docker build -t food-backend ./backend
          docker build -t food-frontend ./frontend
        '''
      }
    }

    stage('Image Scan - Trivy') {
      steps {
        sh '''
          docker run --rm aquasec/trivy image --severity HIGH,CRITICAL food-backend
          docker run --rm aquasec/trivy image --severity HIGH,CRITICAL food-frontend
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh 'docker compose up -d'
      }
    }

    stage('DAST - OWASP ZAP') {
      steps {
        sh '''
          docker run --rm --network host \
            -v $(pwd):/zap/wrk \
            zaproxy/zap-stable zap-baseline.py \
            -t http://localhost:80 \
            -c zap-rules.conf \
            -r zap-report.html
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Pipeline completed successfully"
    }
    failure {
      echo "❌ Pipeline failed – check logs"
    }
  }
}
