FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS development

COPY . .

EXPOSE 5173

# The frontend-only build context contains the committed, synchronized datasets.
# Run `npm run sync:data` in the repository before building or editing data.
# Local `npm run dev` still runs the repository-level synchronization hooks.
CMD ["npm", "exec", "--", "vite", "--host", "0.0.0.0"]

FROM dependencies AS build

ARG VITE_API_URL=/api
ARG VITE_CERTIFICATE_MODE=local

COPY . .
# Calling Vite explicitly avoids lifecycle hooks that need ../scripts outside
# this build context. Only public frontend settings may be supplied as ARGs.
RUN case "$VITE_CERTIFICATE_MODE" in local|server) ;; *) echo "VITE_CERTIFICATE_MODE must be local or server" >&2; exit 1 ;; esac \
    && VITE_API_URL="$VITE_API_URL" VITE_CERTIFICATE_MODE="$VITE_CERTIFICATE_MODE" npm exec -- vite build

FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
