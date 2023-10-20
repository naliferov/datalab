FROM ubuntu:22.04
#COPY . /app
RUN apt-get update
RUN apt-get -y install curl zip
#CMD python /app/app.py