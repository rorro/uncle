#!/bin/bash

read_var() {
    VAR=$(grep $1 $2 | xargs)
    IFS="=" read -ra VAR <<< "$VAR"
    echo ${VAR[1]}
}

SSH_PORT=$(read_var SSH_PORT .env)
SSH_IP=$(read_var SSH_IP .env)
REMOTE_DESTINATION=$(read_var REMOTE_DESTINATION .env)

scp -P $SSH_PORT -r dist/ $SSH_IP:$REMOTE_DESTINATION