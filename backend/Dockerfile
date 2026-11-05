
# Build stage
FROM gradle:9.0-jdk21 AS build

WORKDIR /app

COPY build.gradle ./
COPY src ./src

RUN gradle bootJar --no-daemon

# Run stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/build/libs/*-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
