FROM node:12

# Create project directory
RUN mkdir -p /opt/graph-gitleaks-findings
WORKDIR /opt/graph-gitleaks-findings

# Install latest build of gitleaks binary (golang, no external deps)
COPY --from=zricethezav/gitleaks:latest /usr/bin/gitleaks /usr/bin/gitleaks

COPY yarn.lock package.json /opt/graph-gitleaks-findings/

RUN yarn install --production --cache-folder .ycache && \
  rm -rf .ycache

# Bundle graph-gitleaks-findings source
COPY ./src /opt/graph-gitleaks-findings/src/

COPY gitleaks.config /opt/graph-gitleaks-findings/gitleaks.config

RUN ssh-keyscan -t rsa bitbucket.org >> /etc/ssh/ssh_known_hosts

ENTRYPOINT ["node", "/opt/graph-gitleaks-findings/src/index.js"]
