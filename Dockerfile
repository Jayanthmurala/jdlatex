FROM node:18 AS node_builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Stage 2: Install minimal TeX Live
FROM debian:stable-slim AS texlive_installer

# Install a minimal TeX Live distribution
RUN apt-get update && apt-get install -y --no-install-recommends \
     texlive-base \
     texlive-latex-base \
     texlive-fonts-recommended \
     texlive-binaries \
     latexmk \
     libpng16-16 \
     && ldconfig \
     && export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/lib/x86_64-linux-gnu/ \
     && apt-get clean \
     && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Stage 3: Final runtime image
FROM node:18-slim

# Copy TeX Live binaries and libraries from the texlive_installer stage
COPY --from=texlive_installer /usr/bin/pdflatex /usr/bin/pdflatex
COPY --from=texlive_installer /usr/bin/latexmk /usr/bin/latexmk
COPY --from=texlive_installer /usr/share/texlive /usr/share/texlive
COPY --from=texlive_installer /etc/texmf /etc/texmf

# Copy the Node.js application from the node_builder stage
WORKDIR /app
COPY --from=node_builder /app .

# Cloud Run will set PORT environment variable
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
