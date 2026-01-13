pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-u root:root'
        }
    }

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        SONAR_PROJECT_KEY = 'food-delivery'
        APP_URL = 'http://localhost:3000'
    }

    stages {

        /* =========================
           Prepare Tools
        ========================== */
        stage('Prepare Tools') {
            steps {
                sh '''
                  apk update
                  apk add --no-cache openjdk17-jre docker-cli
                  java -version
                  docker --version
                '''
            }
        }

        /* =========================
           Checkout Source Code
        ========================== */
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'git@github.com:Ferjani-r/Food-Delivery-DevSecOps.git',
                        credentialsId: 'github-ssh'
                    ]],
                    extensions: [[
                        $class: 'CloneOption',
                        shallow: true,
                        depth: 1
                    ]]
                ])
            }
        }

        /* =========================
           Install Dependencies
        ========================== */
        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        /* =========================
           SAST - SonarQube
        ========================== */
        stage('SAST - SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        withCredentials([
                            string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')
                        ]) {
                            sh """
                              ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.sources=backend,frontend/src \
                                -Dsonar.exclusions=**/node_modules/**,**/dist/**
                            """
                        }
                    }
                }
            }
        }

        /* =========================
           Quality Gate
        ========================== */
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        /* =========================
           Start Application (DAST)
        ========================== */
        stage('Start Application') {
            steps {
                sh '''
                  docker compose up -d
                  sleep 20
                '''
            }
        }

        /* =========================
           DAST - OWASP ZAP
        ========================== */
        stage('DAST - OWASP ZAP') {
            steps {
                sh '''
                  docker run --rm \
                    --network host \
                    -v $(pwd):/zap/wrk \
                    owasp/zap2docker-stable zap-baseline.py \
                    -t ${APP_URL} \
                    -r zap-report.html || true
                '''
            }
        }
    }

    /* =========================
       Post Actions
    ========================== */
    post {
        always {
            archiveArtifacts artifacts: 'zap-report.html', allowEmptyArchive: true
            sh 'docker compose down || true'
            cleanWs()
        }
    }
}
