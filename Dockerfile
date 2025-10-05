FROM node:18

# Install TeX Live
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Cloud Run will set PORT environment variable
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
