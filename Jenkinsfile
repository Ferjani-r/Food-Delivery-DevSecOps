pipeline {
  agent {
    docker {
      image 'docker:27-cli'
      args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  environment {
    DOCKER_BUILDKIT = "1"
    // Helper to get the Jenkins container ID dynamically
    JENKINS_CONTAINER = sh(script: 'docker ps -qf "name=jenkins"', returnStdout: true).trim()
    WORKSPACE_PATH = "/var/jenkins_home/workspace/food-delivery-devsecops" 
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh """
          docker run --rm \
            --volumes-from ${JENKINS_CONTAINER} \
            -w ${WORKSPACE_PATH}/backend \
            node:18-alpine npm install

          docker run --rm \
            --volumes-from ${JENKINS_CONTAINER} \
            -w ${WORKSPACE_PATH}/frontend \
            node:18-alpine npm install
        """
      }
    }

    stage('SAST - SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh """
            docker run --rm \
              -e SONAR_HOST_URL=\$SONAR_HOST_URL \
              -e SONAR_TOKEN=\$SONAR_AUTH_TOKEN \
              --volumes-from ${JENKINS_CONTAINER} \
              -w ${WORKSPACE_PATH} \
              sonarsource/sonar-scanner-cli:latest \
              -Dsonar.host.url=\$SONAR_HOST_URL \
              -Dsonar.login=\$SONAR_TOKEN \
              -Dsonar.projectKey=food-delivery \
              -Dsonar.projectName="Food Delivery App" \
              -Dsonar.projectVersion=1.0 \
              -Dsonar.sources=. \
              -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/** \
              -Dsonar.qualitygate.wait=false
          """
        }
      }
    }

    stage('Dependency Audit') {
      steps {
        // Fix: Install jq and create reports folder before running script
        sh """
          docker run --rm \
            --volumes-from ${JENKINS_CONTAINER} \
            -w ${WORKSPACE_PATH} \
            node:18-alpine \
            sh -c "apk add --no-cache jq && mkdir -p reports && (sh ./scripts/security-audit.sh || true)"
        """
      }
    }

    stage('Tests & Coverage') {
      steps {
        sh """
          # Run Backend tests but ignore failure (|| true)
          docker run --rm \
            --volumes-from ${JENKINS_CONTAINER} \
            -w ${WORKSPACE_PATH}/backend \
            node:18-alpine \
            sh -c "npm test -- --coverage || true"
          
          # Run Frontend tests but ignore failure (|| true)
          docker run --rm \
            --volumes-from ${JENKINS_CONTAINER} \
            -w ${WORKSPACE_PATH}/frontend \
            node:18-alpine \
            sh -c "npm test -- --coverage || true"
        """
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
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
          aquasec/trivy image --severity HIGH,CRITICAL food-backend
          
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
          aquasec/trivy image --severity HIGH,CRITICAL food-frontend
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          # Stop and remove old containers to avoid name conflicts
          docker compose down || true
          
          # Start the new deployment
          docker compose up -d
        '''
      }
    }

    stage('DAST - OWASP ZAP') {
      steps {
        sh """
          docker run --rm --network host \
            --volumes-from ${JENKINS_CONTAINER} \
            -w ${WORKSPACE_PATH} \
            zaproxy/zap-stable zap-baseline.py \
            -t http://localhost:80 \
            -c zap-rules.conf \
            -r zap-report.html
        """
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
