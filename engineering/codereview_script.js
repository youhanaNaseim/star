module.exports = async ({github, context, core}) => {

    // (1) Get commit sha    
    let commit_sha = context.sha
    console.log("Commit : ", commit_sha)

    // (2) Look up pull request by commit sha
    const query = `query associatedPRs($sha: String, $repo: String!, $owner: String!){
      repository(name: $repo, owner: $owner) {
        commit: object(expression: $sha) {
          ... on Commit {
            associatedPullRequests(first:5){
              edges{
                node{
                  title
                  number
                  body
                }
              }
            }
          }
        }
      }
    }`;

    const variables = {
      owner: context.repo.owner,
      name: context.repo.repo,
      sha: commit_sha
    }
    const result = await github.graphql(query, variables)
    console.log("Result : ", result)

    // (3) If no pull request then this is a push (create card = true)

    // (4) If there is a pull request , check if there are any approved reviewers (create card = !approved reviewers)

    // (5) If create card , create the card on the review board
  }