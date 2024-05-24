# Contributing

Contributions are more than welcome! Some questions I ask you to consider before contributing:

- **Is the changes you want to implement major or do you want to introduce a new feature?** In that case I would appreciate if you open an issue first to describe what you would like to change/add. That way we can discuss if the changes fit into this project and how we can approach them. By doing this you can avoid doing extra work that might not be accepted by the project in the end.
- **Have you found a bug?** Great, feel free to open an issue, or even better open a PR directly!

## Setting up the repository for contributions

If you would like to submit a PR for the project I would appreciate if you made a fork of the project and implemented the changes on a branch on that fork, and then submitting a PR onto `main`.

1. Fork repository and `cd` into the project folder
2. Install dependencies with `npm install`
3. Run `yarn test:watch` to keep tests running
4. Run `yarn dev` to rebuild the cli on changes, this will also check types

You can test your changes in the example directory. There you'll find both a WordPress plugin and theme. To start a local WordPress server with the theme and plugin installed run `yarn example:start`.

## Making sure changes are tracked

Both if you fix a bug or introduce a new feature we need to track that change to make sure we include the changes in the correct release and that the changelog is properly updated when releasing a new version. Do that by following these steps:

1. `yarn changeset` will start an interactive cli
2. Select the type of change you're making

- `patch` Select this if it is a bug fix that will benefit the current release line
- `minor` Select this if you're introducing a new feature that is backwards compatible
- `major` Select this if you're introducing a breaking change

3. Make sure you include a description of the changes that will later be included in the changelog

## Releases

Releases are managed by the repository admins. When a PR is merged into main your changes will be automatically included in a "release" PR. This PR will then be merged by administrators. If we know that more changes are incoming we might hold off on releasing until we have more changes to include in the release.
