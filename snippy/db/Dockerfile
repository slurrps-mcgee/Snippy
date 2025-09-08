FROM mcr.microsoft.com/mssql/server:2022-latest

ENV ACCEPT_EULA=Y
ENV MSSQL_PID=Developer

WORKDIR /usr/src/app

# Become root so we can copy and set permissions
USER root

COPY init.sh /usr/src/app/init.sh
RUN chmod 755 /usr/src/app/init.sh

# Switch back to default user
USER mssql

CMD ["/bin/bash", "/usr/src/app/init.sh"]
