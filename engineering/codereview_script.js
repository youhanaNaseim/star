module.exports = async ({github, context, core}) => {
    /*
    const {SHA} = process.env
    const commit = await github.rest.repos.getCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: `${SHA}`
    })
    */
   
    console.log("Process : ", process)
    console.log("Context : ", context)
  }