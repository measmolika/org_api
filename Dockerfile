FROM node:10
# Create app directory
RUN mkdir -p /usr/src/org_api
WORKDIR /usr/src/org_api
# Install app dependencies
COPY package*.json ./
RUN npm install
#scripts for syncronizing containers
RUN git clone https://github.com/vishnubob/wait-for-it.git
# Bundle app source
COPY . .
RUN chmod +x wait-for-it.sh
