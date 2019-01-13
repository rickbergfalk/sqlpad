#!/bin/bash

# Get directory script is in
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $SCRIPTS_DIR/..
SQLPAD_DIR=`pwd`

# run linter
npm run lint --prefix "$SQLPAD_DIR/client"
npm run lint --prefix "$SQLPAD_DIR/server"
