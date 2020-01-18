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
Due to problems with CORS you need to run your web browser in disabled web security mode in order for your ajax requests to not be declined. We are working to fix this asap!

To start chromium in disabled web security mode in linux
```Startup
chromium --disable-web-security --allow-file-access-from-files --user-data-dir=~/chromeTemp
```

Open /frontend/signin.html in web browser

A user can only become a manager by manually flagging them as such in the database, the database comes with a default manager with the username "manager" and password "manager" without quotes.

An online version of the system can be accessed here http://172.105.77.21/ (which also requires your browser to be in disabled web security mode, again we are trying to fix this asap! (hopefully before you even read this!))
