module.exports = async ({github, context, core}) => {

    // Get commit sha    
    let commit_sha = context.sha

    // Look up pull request by commit sha
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
      repo: context.repo.repo,
      sha: commit_sha
    }
    const result = await github.graphql(query, variables)

    let create_card = true
    let review_url = context.payload.compare
    let title = "Review commit " + commit_sha

    const pullRequests = result.repository.commit.associatedPullRequests.edges
    if (pullRequests && pullRequests.length > 0) {
      
      console.log("Pull Request Data : ", JSON.stringify(pullRequests))

      let pullrequest_id = pullRequests[0].node.number

      console.log("Pull Request Id : ", pullrequest_id)

      // Retrieve pull request object & inspect approvers
      const pullrequest_result = await github.request('GET /repos/{owner}/{repo}/pulls/{pull_number}',{
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pullrequest_id,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      console.log("Result : ", JSON.stringify(pullrequest_result))

    }

    // If create card , create the card on the review board
    console.log("Title : ", title)
    console.log("Review Url : ", review_url)
  }