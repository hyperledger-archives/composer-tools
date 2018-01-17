#!/bin/bash
#
echo "Gathering system information..."

# setup 
setup()
{
  DC_DIR="/tmp/DataCapture"
  if ! [[ -d "$DC_DIR" && ! -L "$DC_DIR" ]] ; then
    echo 'Creating temporary directory' $DC_DIR
    mkdir $DC_DIR
    if [ $? -ne 0 ] ; then
      echo "Could not make temp directory for data capture" 
      exit 1
    fi
  fi
  CURRENT_DATE=$(date +"%Y-%m-%d")
  ENVOUTFILE="$DC_DIR/"environment-"$CURRENT_DATE".log
  OUTFILE="composer_logs."$CURRENT_DATE.tgz
  if [ -x $OUTFILE ]; then 
    echo "Error: output file already exists" $OUTFILE
    exit 1
  fi
  if [ -x $ENVOUTFILE ]; then 
    rm $ENVOUTFILE
  fi
  touch $ENVOUTFILE && chmod +w $ENVOUTFILE
}

# teardown
teardown() 
{
  rm -rf $DC_DIR
}

# Get the versions of the commands that should be installed
get_command_info() 
{
  if ! [ -x "$(command -v uname)" ]; then
    echo 'Error: Could not detect OS.' >&2
  else
    echo 'The current OS is ' $(uname -a) >> $ENVOUTFILE
  fi
  if ! [ -x "$(command -v node)" ]; then
    echo 'Error: NodeJS is not installed.' >&2
  else
    echo 'The current version of NodeJS is' $(node --version) >> $ENVOUTFILE
    NODECMD=node
  fi
  if ! [ -x "$(command -v npm)" ]; then
    echo 'Error: NPM is not installed.' >&2
  else
    echo 'The current version of NPM is' $(npm --version) >> $ENVOUTFILE
    NPMCMD=npm
  fi
  if ! [ -x "$(command -v composer)" ]; then
    echo 'Error: composer is not installed.' >&2
  else
    echo 'The current version of Composer is' $(composer --version) >> $ENVOUTFILE
    echo 'The current PATH to the composer command is' $(which composer) >> $ENVOUTFILE
    COMPOSERCMD=composer
  fi
  if ! [ -x "$(command -v docker-compose)" ]; then
    echo 'docker-compose is not installed.' >&2
  else
    echo 'The current version of docker-compose is' $(docker-compose --version) >> $ENVOUTFILE
    DOCKER_COMPOSE_CMD=docker-compose
  fi
  if ! [ -x "$(command -v docker)" ]; then
    echo 'Error: docker is not installed.' >&2
  else
    echo 'The current version of Docker is' $(docker --version) >> $ENVOUTFILE
    DOCKER_CMD=docker
    echo "Running docker containers \n" >> $ENVOUTFILE
    echo "$($DOCKER_CMD ps)" >> $ENVOUTFILE
  fi
}

get_composer_info() 
{
  echo "Composer Information" >> $ENVOUTFILE
  if [ ! -z $COMPOSERCMD ]; then
    echo "$($COMPOSERCMD card list)" >> $ENVOUTFILE 
  fi
}

get_docker_logs()
{
  if [ ! -z $DOCKER_CMD ]; then 
    CONTAINERS=$($DOCKER_CMD ps -aq)
    for CONTAINER in $CONTAINERS;
    do
      echo "Getting docker logs for container ID: " $CONTAINER;
      $($DOCKER_CMD logs $CONTAINER >& $DC_DIR/$CONTAINER.log)
    done;
  else 
    echo "Docker Command not found"; 
  fi
}
package()
{
  cd "$DC_DIR" && tar zcf "../$OUTFILE" * && cd ..
  echo "Successfully gathered data in /tmp/"$OUTFILE
}

setup
get_command_info
get_docker_logs
get_composer_info
package
teardown
