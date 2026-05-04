// Function to add the latest 2 posts to the home page
async function loadLatestPosts() {

    // Load posts data
    const post_response = await fetch("/api/posts");
    const post_data = await post_response.json();

    //Load login data from database
    const login_response = await fetch("/api/user");
    const login_data = await login_response.json();

    // Remove current posts from page
    let postList = document.getElementById('postsList');

    for (let i = 0; i < postList.children.length; i++) {
        if (postList.children[i].nodeName == "article") {
            postList.removeChild(postList.children[i]);
        }
    }

    // Load latest 2 posts
    const latestPosts = [...post_data]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 2);

    for (let i = 0; i < latestPosts.length; i++) {
        const post = latestPosts[i];

        let postContainer = document.createElement('article');
        postContainer.classList.add("post");

        let fig = document.createElement('figure');
        postContainer.appendChild(fig);

        let postIdContainer = document.createElement("p");
        postIdContainer.textContent = post.postid;
        postIdContainer.hidden = true;
        postIdContainer.id = "postId";
        postContainer.appendChild(postIdContainer);

        let img = document.createElement('img');
        let figcap = document.createElement('figcaption');
        fig.appendChild(img);
        fig.appendChild(figcap);

        let titleContainer = document.createElement('h3');
        titleContainer.textContent = post.title;
        figcap.appendChild(titleContainer);

        let usernameContainer = document.createElement('h5');
        usernameContainer.textContent = post.username;
        figcap.appendChild(usernameContainer);

        let timeContainer = document.createElement('h5');
        timeContainer.textContent = post.timestamp;
        figcap.appendChild(timeContainer);

        let contentContainer = document.createElement('p');
        contentContainer.innerHTML = DOMPurify.sanitize(post.content);
        figcap.appendChild(contentContainer);

        postList.appendChild(postContainer);
    }
}

loadLatestPosts();