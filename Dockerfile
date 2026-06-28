# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend, embedding the frontend assets
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app
COPY backend/pom.xml ./backend/
# Resolve dependencies to cache them
RUN mvn -f backend/pom.xml dependency:go-offline -B
COPY backend/src ./backend/src/
# Copy the built React assets into Spring Boot's static resources
COPY --from=frontend-builder /app/frontend/dist /app/backend/src/main/resources/static
RUN mvn -f backend/pom.xml clean package -DskipTests

# Stage 3: Package final runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
