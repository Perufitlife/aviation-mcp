FROM apify/actor-node:22

COPY --chown=myuser:myuser package*.json ./

RUN npm --quiet set progress=false \
    && npm install --only=prod --no-optional

COPY --chown=myuser:myuser . ./

# Launcher picks transport by environment: HTTP standby on Apify (paid hosted
# endpoint), stdio everywhere else (Glama build/test, generic docker, local).
CMD ["node", "src/start.js"]
