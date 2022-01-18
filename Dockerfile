FROM  --platform=$BUILDPLATFORM node:16-alpine as serverbuild
ARG BUILDPLATFORM

COPY . /service/
WORKDIR /service/
RUN yarn --pure-lockfile
RUN yarn run gulp prod

FROM node:16-alpine
COPY --from=serverbuild /service/dist/ /service/
WORKDIR /service/
RUN yarn install --pure-lockfile --production=true


WORKDIR /service/
CMD ["node", "service.js"]
