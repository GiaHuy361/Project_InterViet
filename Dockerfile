# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG DatabaseProvider=Postgres
WORKDIR /src

# Copy solution and project files to restore dependencies
COPY ["Interviet.sln", "./"]
COPY ["src/Interviet.Api/Interviet.Api.csproj", "src/Interviet.Api/"]
COPY ["src/Interviet.Application/Interviet.Application.csproj", "src/Interviet.Application/"]
COPY ["src/Interviet.Contracts/Interviet.Contracts.csproj", "src/Interviet.Contracts/"]
COPY ["src/Interviet.Domain/Interviet.Domain.csproj", "src/Interviet.Domain/"]
COPY ["src/Interviet.Infrastructure/Interviet.Infrastructure.csproj", "src/Interviet.Infrastructure/"]
COPY ["src/Interviet.Shared/Interviet.Shared.csproj", "src/Interviet.Shared/"]

RUN dotnet restore

# Copy all source files
COPY src/ src/

# Build and publish for PostgreSQL
WORKDIR /src/src/Interviet.Api
RUN dotnet publish -c Release -o /app/publish /p:DatabaseProvider=${DatabaseProvider} --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose dynamic Render PORT
ENV PORT=80
EXPOSE 80

ENTRYPOINT ["dotnet", "Interviet.Api.dll"]
