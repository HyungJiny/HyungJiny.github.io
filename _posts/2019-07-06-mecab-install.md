---
layout: post
title:  "Mac Mojave에 Mecab 설치하기"
date:   2019-07-06 19:05:00 +0900
categories: Python
---
## Mac Mojave에 Mecab 설치하기

### 기본 환경 구축

- **GCC 7.0+, G++ 7.0+, Java JDK 8+** 가 기본 환경에 설치 되어있지 않으면 에러 발생
- Automake 실행이 안되는 경우(gcc, g++ 환경 설치가 안되어 있을 때 일어남)
    - `$ brew install automake` 로 make를 진행할 수 있는 환경 만들기
    - brew가 설치되어 있지 않은 경우  https://brew.sh/ 에서 설치

### Mecab-ko 설치

- Mecab-ko 사이트 : https://bitbucket.org/eunjeon/mecab-ko/downloads/

```bash
# Home 디렉토리에서 작업
$ wget https://bitbucket.org/eunjeon/mecab-ko/downloads/mecab-0.996-ko-0.9.2.tar.gz
$ tar xvfz mecab-0.996-ko-0.9.2.tar.gz
$ cd mecab-0.996-ko-0.9.2
$ ./configure
$ make
$ make check
# make 과정에서 발생하는 warning은 무시해도 무관
$ sudo make install
# /usr/bin/install –c –m 644 mecabrc ’/usr/local/etc’가 나오면 완료
$ sudo ldconfig
$ mecab --version
mecab of 0.996/ko-0.9.2

```

### Mecab-ko-dic 설치

- Mecab-ko-dic 사이트 : https://bitbucket.org/eunjeon/mecab-ko-dic/downloads/

```bash
# Home 디렉토리에서 작업
$ wget https://bitbucket.org/eunjeon/mecab-ko-dic/downloads/mecab-ko-dic-2.1.1-20180720.tar.gz
$ tar xvfz mecab-ko-dic-2.1.1-20180720.tar.gz
$ ./configure
$ make
$ sudo make install
# /usr/bin/install -c -m 644 model.bin matrix.bin char.bin sys.dic unk.dic left-id.def right-id.def rewrite.def pos-id.def dicrc ‘/usr/local/lib/mecab/dic/mecab-ko-dic’가 나오면 완료
```

### Mecab 설치 테스트

```bash
$ mecab -d /usr/local/lib/mecab/dic/mecab-ko-dic
오늘은 날씨가 좋다
오늘	NNG,*,T,오늘,*,*,*,*
은	JX,*,T,은,*,*,*,*
날씨	NNG,*,F,날씨,*,*,*,*
가	JKS,*,F,가,*,*,*,*
좋	VA,*,T,좋,*,*,*,*
다	EC,*,F,다,*,*,*,*
EOS
# Ctrl + c 로 실행 취소
```

- [품사 태그표](https://docs.google.com/spreadsheets/d/1-9blXKjtjeKZqsf4NzHeYJCrr49-nXeRF6D80udfcwY/edit#gid=4)

### Python에서 설치한 Mecab 이용하기
- python3의 mecab 라이브러리 설치 후 로컬에 설치된 사전으로 tagger를 생성

```bash
$ pip install mecab-python3
```

![jupyter-mecab](https://user-images.githubusercontent.com/11986878/77544062-e06f9380-6eeb-11ea-8d59-c82885cb5e13.png)

### 개인 사전 단어 추가하기

- 위에서 다운로드한 Mecab-ko-dic 디렉토리에서 작업 진행
    - 현재 튜토리얼에서는 ~/mecab-ko-dic-2.1.1-20180720 에서 진행 중
- user-dic 안에 nnp.csv 양식을 따름
    - user-dic/nnp.csv 을 복사하여 nng.csv를 생성하면 개인 고유명사 사전 생성에 편함
        - `cp user-dic/nnp.csv user-dic/nng.csv`
    - [사전 형식표](https://docs.google.com/spreadsheets/d/1-9blXKjtjeKZqsf4NzHeYJCrr49-nXeRF6D80udfcwY/edit#gid=1)
- nng.csv 생성 예시

<img src="https://user-images.githubusercontent.com/11986878/77546294-00548680-6eef-11ea-93c3-46b27436a90e.png" width="60%">

```bash
# coreutils가 설치되어있지 않으면 경로 에러 발생
$ brew install coreutils
# 추가된 user-*.csv 파일들을 확인 할 수 있음
$ ./tools/add-userdic.sh
# 새로 추가된 사전으로 컴파일
$ sudo make install
# 내용 테스트
$ mecab –d /usr/local/lib/mecab/dic/mecab-ko-dic
```

- python에서 사전 적용 테스트

<img src="https://user-images.githubusercontent.com/11986878/77546243-e87d0280-6eee-11ea-921b-142b0005be5a.png" width="60%">

---
## 참고문헌
- http://eunjeon.blogspot.com/2014/06/blog-post.html