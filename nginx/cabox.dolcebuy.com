server {
    listen 80;
    server_name cabox.dolcebuy.com www.cabox.dolcebuy.com;
    return 301 https://cabox.dolcebuy.com$request_uri;
}

server {
    listen 443 ssl;
    server_name cabox.dolcebuy.com;

    ssl_certificate /etc/letsencrypt/live/cabox.dolcebuy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cabox.dolcebuy.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 25M;

    location / {
        proxy_pass http://localhost:6410;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name www.cabox.dolcebuy.com;

    ssl_certificate /etc/letsencrypt/live/cabox.dolcebuy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cabox.dolcebuy.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://cabox.dolcebuy.com$request_uri;
}
