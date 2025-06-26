(async function() {
    const el = document.getElementById("sidebar-version");
    if (el) el.textContent = "loading...";
    try {
        const repoOwner = "team-cardinalis";
        const repoName = "STACY-Web";
        const branch = "main";

        let baseVersion = "0.0.0";

        let commits = [];
        let page = 1;
        let fetchMore = true;
        while (fetchMore) {
            const commitsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits?sha=${branch}&per_page=100&page=${page}`;
            const commitsResp = await fetch(commitsUrl);
            if (!commitsResp.ok) throw new Error("GitHub API error");
            const pageCommits = await commitsResp.json();
            commits = commits.concat(pageCommits);
            if (pageCommits.length < 100) fetchMore = false;
            else page++;
        }

        let [major, minor, patch] = baseVersion.split(".").map(Number);

        const commitDetails = await Promise.all(
            commits.reverse().map(async (commit) => {
                const commitDetailResp = await fetch(commit.url);
                if (!commitDetailResp.ok) return null;
                return await commitDetailResp.json();
            })
        );

        for (const commitDetail of commitDetails) {
            if (!commitDetail) continue;
            const files = commitDetail.files || [];
            const filesChanged = files.length;
            let linesChanged = 0;
            for (const f of files) {
                linesChanged += Math.abs(f.additions || 0) + Math.abs(f.deletions || 0);
            }
            if (filesChanged > 10 || linesChanged > 100) {
                major += 1; minor = 0; patch = 0;
            } else if (filesChanged > 3 || linesChanged > 20) {
                minor += 1; patch = 0;
            } else {
                patch += 1;
            }
        }

        if (el) el.textContent = `v${major}.${minor}.${patch}`;
    } catch (error) {
        console.error("Error fetching version info:", error);
        const el = document.getElementById("sidebar-version");
        if (el) el.textContent = "error";
    }
})();