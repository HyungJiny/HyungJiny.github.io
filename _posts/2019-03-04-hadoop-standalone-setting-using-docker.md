---
layout: post
title:  "Docker를 이용하여 Hadoop standalone 설정하기"
date:   2019-03-04 17:15:00 +0900
categories: Ubuntu
---
## Docker Ubuntu container 생성하기
도커(Docker)에서 container를 생성하기 위해서는 이미지를 가져오는 것이 우선이다.
만약 docker 명령어가 실행되지 않는다면 설치에 문제가 있거나, 관리자 권한이 없기 때문일것이다.

```bash
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE

$ docker pull ubuntu
Using default tag: latest
latest: Pulling from library/ubuntu
6cf436f81810: Pull complete
987088a85b96: Pull complete
b4624b3efe06: Pull complete
d42beb8ded59: Pull complete
Digest: ########################################
Status: Downloaded newer image for ubuntu:latest

$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
ubuntu              latest              47b19964fb50        3 weeks ago         88.1MB
```

위와 같이 images에 ubuntu 이미지가 등록되었다면 container로 실행시켜주면 된다.

```bash
$ docker run --name hadoop-standalone -i -t ubuntu /bin/bash
root@2237777cfdcf:/#
```

`--name` 옵션은 container의 이름을 정해주는 옵션이므로 원하는대로 지정하면 된다.
위 명령어는 bash를 실행시키는 명령어이기에 container의 bash가 켜진다면 성공이다.
만들어진 container는 또 다른 터미널에서 `ps`를 통해 확인할 수 있다.

```bash
$ docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
2237777cfdcf        ubuntu              "/bin/bash"         6 seconds ago       Up 5 seconds                            hadoop-standalone
```

## 기본 환경 설치
Hadoop Standalone 설치 과정은 전적으로 [Hadoop Setting](http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/SingleCluster.html) 사이트를 참고하면 쉽게 진행할 수 있다.
설치에 앞서 컨테이너가 정상 동작 할 수 있도록 기본적으로 필요한 소프트웨어를 설치하자.

```
root@2237777cfdcf:/# apt-get update
root@2237777cfdcf:/# apt-get upgrade
root@2237777cfdcf:/# apt-get install -y vim ssh rsync software-properties-common
```

### JDK 설치하기
Ubuntu를 사용하면서 대부분의 사람들은 설치하기 쉬운 OpenJDK를 사용한다.
하지만 Hadoop에서는 Oracle JDK를 이용할 것을 권장한다.
개인적으로 안정적이라 생각되는 `Java 8`을 설치하였다.

Ubuntu에서 Oracle JDK를 설치하기 위해서는 repository를 등록해주어야 하는데, Ubuntu container에는 `add-apt-repository` 명령어가 없다.
그래서 위에서 `software-properties-common`을 미리 설치해두었다.
 
```
root@2237777cfdcf:/# add-apt-repository ppa:webupd8team/java
root@2237777cfdcf:/# apt-get update
root@2237777cfdcf:/# apt-get install -y oracle-java8-installer
root@2237777cfdcf:/# apt-get install -y oracle-java8-set-default
```

installer를 설치하다보면 중간에 약관 동의가 있는데 'yes'를 입력해주면 된다. 

<img width="530" alt="2019-03-04 4 42 07" src="https://user-images.githubusercontent.com/11986878/53717816-aaa0dc80-3e9c-11e9-8eb9-327136b2a405.png">

위와 같은 모습으로 Java의 버전이 출력된다면 성공이다.

#### $JAVA_HOME Path 설정(Option)
home에 있는 `~/.bashrc`를 수정하여 JAVA_HOME을 설정해줄 수 있다.

```bash
export JAVA_HOME=/usr/lib/jvm/java-8-oracle/bin
```
`~/.bashrc`의 마지막 줄에 위 옵션을 추가한 후 `source ~/bashrc` 를 해주면 JAVA_HOME이 등록되는 것을 확인할 수 있다.

<img width="650" alt="2019-03-04 4 50 47" src="https://user-images.githubusercontent.com/11986878/53718136-bccf4a80-3e9d-11e9-8d45-10659ea8d73e.png">

확인해보면 다음과 같이 나오는 것을 확인할 수 있다.

## Hadoop 설치하기

하둡 설치를 위한 파일을 Apache에서 권장하는 [mirror server](http://mirror.navercorp.com/apache/hadoop/common/)를 통해 다운받는다.
여기에서는 `Hadoop 2.9.2`버전을 이용한다.
tar 파일 다운로드는 `wget`을 통해 쉽게 할 수 있다.
파일이 섞이는 것을 방지하기 위해 home으로 이동하여 실행하였다.
다운받은 tar.gz 압축파일을 풀고, 디렉토리 이름을 hadoop으로 변경해준다.

```
root@2237777cfdcf:~# wget http://mirror.navercorp.com/apache/hadoop/common/hadoop-2.9.2/hadoop-2.9.2.tar.gz
root@2237777cfdcf:~# tar xvfz hadoop-2.9.2.tar.gz
root@2237777cfdcf:~# mv hadoop-2.9.2 hadoop
```

이제, `[HADOOP_DIR]/etc/hadoop/hadoop-env.sh`에 JAVA_HOME 옵션을 수정해주어야한다.
위에서 설치한 Java의 위치를 지정해주면 된다.
위 설치과정을 따라했다면 JAVA_HOME의 경로는 `/usr/lib/jvm/java-8-oracle`이다.
설정을 변경 후 Hadoop을 실행시켜보면 아래와 같은 결과를 볼 수 있다.

<img width="650" alt="2019-03-04 5 05 51" src="https://user-images.githubusercontent.com/11986878/53719080-69aac700-3ea0-11e9-960c-5ba154d75a6c.png">

## Mapreduce 예제 실행해보기

설치가 끝났다면 간단한 예제를 실행시킴으로 확인해보자.
예제는 기본으로 제공하는 mapreduce를 이용해보았다.

```
root@2237777cfdcf:~/hadoop# mkdir input
root@2237777cfdcf:~/hadoop# cp etc/hadoop/*.xml input
root@2237777cfdcf:~/hadoop# bin/hadoop jar share/hadoop/mapreduce/hadoop-mapreduce-examples-2.9.2.jar grep input output 'dfs[a-z.]+'
root@2237777cfdcf:~/hadoop# cat output/*
1	dfsadmin
```

이미지로는 아래와 같은 결과가 나오면 기본 Hadoop 세팅 완료이다.

<img width="650" alt="2019-03-04 5 12 56" src="https://user-images.githubusercontent.com/11986878/53719285-02414700-3ea1-11e9-82f1-01740d7943b6.png">


---
## 참고 자료
- Hadoop Single Node Setup <http://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/SingleCluster.html>