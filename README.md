# M7011E-DynamicWebSystems
Project in the course M7011E

## Local Installation
* Set up a mysql server 
* Install Nodejs


### Installation

```Node
Sudo apt install nodejs
```

### MySql
The mysql should have the following settings

* Username: piedpiper
* password: piedpiper
* database name: node

```Mysql
CREATE DATABASE node;
mysql -u <piedpiper> -p <node> < <db.sql>
```
### Startup
In project folder

```Startup
Node Server.js
```

**NOTICE**
If you are running the program locally you need to run your web browser in disabled web security mode to avoid cors errors with your ajax requests (which are needed to communicate with the api). If you are setting up a server also need to set up a proxy that redirects port 80 to the listening port configured in server.js (default port 3000) in your http server. 

To start chromium in disabled web security mode in linux
```Startup
chromium --disable-web-security --allow-file-access-from-files --user-data-dir=~/chromeTemp
```

Open /frontend/signin.html in web browser

A user can only become a manager by manually flagging them as such in the database, the database comes with a default manager with the username "manager" and password "manager" without quotes.
