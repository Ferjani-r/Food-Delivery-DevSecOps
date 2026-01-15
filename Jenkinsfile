pipeline {
  agent {
    docker {
      image 'node:18-alpine'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
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
          cd backend && npm ci
          cd ../frontend && npm ci
        '''
      }
    }

    stage('SAST - SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh 'sonar-scanner'
        }
      }
    }

    stage('Dependency Audit') {
      steps {
        sh './scripts/security-audit.sh'
      }
    }

    stage('Tests & Coverage') {
      steps {
        sh '''
          cd backend && npm test -- --coverage
          cd ../frontend && npm test -- --coverage
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
          trivy image --severity HIGH,CRITICAL food-backend
          trivy image --severity HIGH,CRITICAL food-frontend
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
