FROM ruby:3.3-slim

# Native extension gems (nokogiri, ffi, ...) need a compiler toolchain and git
# (jekyll-remote-theme fetches the theme over git/https at build time).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential \
     git \
     ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /site

# Install a recent bundler (matches the regenerated Gemfile.lock).
RUN gem install bundler

# Copy only dependency manifests first so `bundle install` is cached across
# content edits. Gemfile.lock must be copied too: docker-compose mounts the
# project over /site at runtime, so the committed lock is what Jekyll resolves
# against -- installing without it here would pin different gem versions and
# fail at startup with "Could not find <gem> in locally installed gems".
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Application source is mounted at runtime via docker-compose (see command).
EXPOSE 4000 35729
