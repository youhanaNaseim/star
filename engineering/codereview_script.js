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

      let pullrequest_id = pullRequests[0].node.number

      // Retrieve pull request object & inspect approvers
      const pullrequest_result = await github.request('GET /repos/{owner}/{repo}/pulls/{pull_number}',{
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pullrequest_id,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (pullrequest_result) {

        title = "Review pull request " + pullrequest_id
        review_url = pullrequest_result.data.html_url

        // Check if the pull request was reviewed
        const pullrequest_reviewers_result = await github.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',{
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: pullrequest_id,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })

        let reviewers_list = pullrequest_reviewers_result.data
        reviewers_list.forEach(i => {
          if (i.state === "APPROVED") create_card = false
        });
      }
    }

    // If create card , create the card on the review board
    console.log("Create Card : ", create_card)
    console.log("Title : ", title)
    console.log("Review Url : ", review_url)

    // Create an issue for the unreviewed work
    const issue = await github.request('POST /repos/{owner}/{repo}/issues', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: title,
      body: review_url,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    let projectOwnerName = context.repo.owner
    let projectNumber = 1

    console.log("Proj Owner Name : ", projectOwnerName, "Proj Number : ", projectNumber)

    const idResp = await github.request('GET /projects/{project_id}', {
      owner: context.repo.owner,
      project_id: projectNumber,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    console.log(idResp)

    const projectId = idResp.data.projectV2.id
    const contentId = issue.data.node_id

    console.log("Project Id : ", projectId, "Content Id : ", contentId)

    const addResp = await github.graphql(
      `mutation addIssueToProject($input: AddProjectV2ItemByIdInput!) {
        addProjectV2ItemById(input: $input) {
          item {
            id
          }
        }
      }`,
      {
        input: {
          projectId: projectId,
          contentId: contentId,
        },
      },
    )
  }