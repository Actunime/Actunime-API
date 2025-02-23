
## Run Locally  
Clone the project  

~~~bash  
  git clone https://github.com/Actunime/actunime-dashboard.git
~~~

Go to the project directory  

~~~bash  
  cd actunime-dashboard
~~~

Install dependencies  

~~~bash  
pnpm install
~~~

Start dev server  

~~~bash  
pnpm run dev
~~~  

Build 

~~~bash  
pnpm run build
~~~

## Add Actunime Package to live dev
Usefull for live test before push
Clone the project

Go to the package directory  

~~~bash  
  cd package-name
~~~

Install dependencies  

~~~bash  
pnpm install
~~~

Start watch updates server  

~~~bash  
pnpm run watch
~~~  

Link the repo globaly

~~~bash  
pnpm link --global
~~~  

Go to your project directory  

~~~bash  
  cd Actunime-Dashboard
~~~

~~~bash  
pnpm link @actunime/package-name --global
~~~  