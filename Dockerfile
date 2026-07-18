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
# content edits. Gemfile.lock is intentionally absent and will be generated.
COPY Gemfile ./
RUN bundle install

# Application source is mounted at runtime via docker-compose (see command).
EXPOSE 4000 35729
