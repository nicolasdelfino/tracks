workflow "publish on release" {
  on = "release"
  resolves = ["publish"]
}

action "Build" {
  uses = "actions/npm@master"
  args = "install"
}

action "publish" {
  needs = "Build"
  uses = "actions/npm@master"
  args = "publish"
  secrets = ["NPM_AUTH_TOKEN"]
}
