// File Upload Handling
const fileInput = document.querySelector('.file-input');
const fileNameDisplay = document.querySelector('.file-name');
const imagePreview = document.querySelector('.mm');
fileInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
        fileNameDisplay.textContent = this.files[0].name;
        imagePreview.src = URL.createObjectURL(this.files[0]);
        imagePreview.style.display = 'block';
    } else {
        fileNameDisplay.textContent = '';
        imagePreview.style.display = 'none';
    }
});

// Textarea Auto-resize
const textarea = document.querySelector('.wave-textarea');
textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const startPos = this.selectionStart;
        const endPos = this.selectionEnd;
        this.value = this.value.substring(0, startPos) + "\n" + this.value.substring(endPos);
        this.selectionStart = this.selectionEnd = startPos + 1;
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    }
});
textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Blog Post Handling
document.querySelector('.kk').addEventListener('click', async function () {
    const title = document.getElementById('blog-title').value.trim();
    const content = document.getElementById('blog-content').value.trim();
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    if (!title) {
        alert('Please enter a title');
        return;
    }
    if (!content) {
        alert('Please enter blog content');
        return;
    }
    try {
        const formData = new FormData();
        formData.append('blog_title', title);
        formData.append('blog_content', content);
        formData.append('uni_code', '<%= userdata.uniCode %>');
        formData.append('col_name', '<%= userdata.collegename %>');
        if (file) {
            formData.append('blog_image', file);
        }
        const response = await fetch('/save-blog', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to save blog');
        }
        if (result.success) {
            window.location.reload();
        } else {
            alert('Error: ' + (result.message || 'Failed to save blog'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving blog: ' + error.message);
    }
});

// Comments System
let currentPostId = null;
let replyingTo = null;
let currentUserId = null; // Store the current user's ID


function setCurrentUserId(userId) {
    currentUserId = userId;
}

function setCurrentPostId(postId) {
    currentPostId = postId;
    replyingTo = null;
    updateCommentInput();
}

async function loadComments(blogId) {
    const container = document.querySelector('.comments-container');
    container.innerHTML = '<div class="text-center py-3">Loading comments...</div>';
    try {
        const response = await fetch(`/comments/${blogId}`);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to load comments');
        }
        container.innerHTML = '';
        if (result.comments && result.comments.length > 0) {
            const buildCommentTree = (comments, parentId = null) => {
                return comments
                    .filter(comment => comment.parent_comment_id === parentId)
                    .map(comment => {
                        const replies = buildCommentTree(comments, comment.comment_id);
                        return {
                            ...comment,
                            replies
                        };
                    });
            };
            const commentTree = buildCommentTree(result.comments);

            const displayComment = (comment, level = 0) => {
                const margin = level * 20;

                // Style @fname mentions in blue and link them using user_id
                const formattedText = comment.comment_text.replace(/@(\w+)/g, (match, fname) =>
                    `<a href="/user-profile?user_id=${comment.user_id}" class="text-primary">@${fname}</a>`
                );

                // Check if current user is the comment owner
                const isOwner = currentUserId === comment.user_id;
                
                // Create dropdown menu with options based on ownership
        // Change deleteComment to confirmCommentDelete
const dropdownOptions = isOwner ? 
`<li><a class="dropdown-item" href="#" onclick="editComment('${comment.comment_id}', '${encodeURIComponent(comment.comment_text)}')">Edit</a></li>
 <li><a class="dropdown-item" href="#" onclick="confirmCommentDelete('${comment.comment_id}')">Delete</a></li>` : 
`<li><a class="dropdown-item" href="#">Report</a></li>`;
                const html = `
                <div class="comment" id="comment-${comment.comment_id}" style="margin-left: ${margin}px">
                    <div class="user-profile d-flex align-items-center">
                        <a href="${comment.user_profile}" class="profile-link">
                            <img src="${comment.user_image}" class="rounded-circle me-2" width="32">
                        </a>
                        <div style="width: 100%;">
                            <div class="post-row">
                                <a href="/user-profile?user_id=${comment.user_id}" class="text-decoration-none" style="color: #000">
                                    <h6 class="mb-0">${comment.user_fname} ${comment.user_lname}</h6>
                                </a>
                                <div class="dropdown" align="right">
                                    <a href="#" class="text-decoration-none" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fa fa-ellipsis-v"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        ${dropdownOptions}
                                    </ul>
                                </div>
                            </div>
                            <small class="text-muted">${timeAgo(comment.timestamp_)}</small>
                        </div>
                    </div>
                    <div class="post-row">
                        <p class="mt-2 mb-0" style="padding: 0 0 0 55px" id="comment-text-${comment.comment_id}">${formattedText}</p>
                        <div class="comment-edit-form d-none" id="edit-form-${comment.comment_id}">
                            <textarea class="form-control mb-2" id="edit-text-${comment.comment_id}">${comment.comment_text}</textarea>
                            <button class="btn btn-sm btn-primary me-2" onclick="saveCommentEdit(${comment.comment_id})">Save</button>
                            <button class="btn btn-sm btn-secondary" onclick="cancelCommentEdit(${comment.comment_id})">Cancel</button>
                        </div>
                        <button style="background-color: #fff; border: none; font-size: 14px;" 
                            class="fontt" 
                            onclick="setReplyingTo(${comment.comment_id}, '${comment.user_fname}')">Reply</button>
                    </div>
                </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
                if (comment.replies && comment.replies.length > 0) {
                    comment.replies.forEach(reply => displayComment(reply, level + 1));
                }
            };

            commentTree.forEach(comment => displayComment(comment));
        } else {
            container.innerHTML = '<div class="text-center py-3">No comments yet</div>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = `<div class="text-center py-3 text-danger">Error loading comments: ${error.message}</div>`;
    }
}

// New function to edit a comment
function editComment(commentId, commentText) {
    const commentElement = document.getElementById(`comment-text-${commentId}`);
    const editForm = document.getElementById(`edit-form-${commentId}`);
    const editTextarea = document.getElementById(`edit-text-${commentId}`);
    
    // Show edit form and hide comment text
    if (commentElement && editForm) {
        commentElement.classList.add('d-none');
        editForm.classList.remove('d-none');
        // Decode the URI component to get the original text
        editTextarea.value = decodeURIComponent(commentText);
        editTextarea.focus();
    }
}

// Save edited comment
async function saveCommentEdit(commentId) {
    const editTextarea = document.getElementById(`edit-text-${commentId}`);
    const commentText = editTextarea.value.trim();
    
    if (!commentText) return;
    
    try {
        const response = await fetch(`/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment_text: commentText })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update comment');
        }
        
        // Instead of reloading comments, update the UI directly
        await loadComments(currentPostId); // This will refresh the entire comment section
        
    } catch (error) {
        console.error('Error updating comment:', error);
        alert('Error updating comment: ' + error.message);
    }
}

// Cancel comment edit
function cancelCommentEdit(commentId) {
    const commentElement = document.getElementById(`comment-text-${commentId}`);
    const editForm = document.getElementById(`edit-form-${commentId}`);
    
    // Hide edit form and show comment text
    if (commentElement && editForm) {
        commentElement.classList.remove('d-none');
        editForm.classList.add('d-none');
    }
}
function createCommentHTML(comment, index) {
    const getProfileLink = (user) => {
        return user.user_profile ? user.user_profile : `/professor-profile-preview?email=${encodeURIComponent(user.user_email)}`;
    };
    const profileLink = getProfileLink(comment);

    // Check if current user is the comment owner
    const isCommentOwner = currentUserId === comment.user_id;
    
    // Create dropdown menu with options based on ownership
    const commentDropdownOptions = isCommentOwner ? 
        `<li><a class="dropdown-item" href="#" onclick="editComment(${comment.comment_id}, '${encodeURIComponent(comment.comment_text)}')">Edit</a></li>
        <li><a class="dropdown-item" href="#" onclick="confirmCommentDelete(${comment.comment_id})">Delete</a></li>
        <li><a class="dropdown-item" href="#">Report</a></li>` : 
        `<li><a class="dropdown-item" href="#">Report</a></li>`;

    const repliesHTML = comment.replies ? comment.replies.map(reply => {
        const replyProfileLink = getProfileLink(reply);

        // Check if current user is the reply owner
        const isReplyOwner = currentUserId === reply.user_id;
        
        // Create dropdown menu with options based on ownership for replies
        const replyDropdownOptions = isReplyOwner ? 
    `<li><a class="dropdown-item" href="#" onclick="editComment('${reply.comment_id}', '${encodeURIComponent(reply.comment_text)}')">Edit</a></li>
     <li><a class="dropdown-item" href="#" onclick="confirmCommentDelete('${reply.comment_id}')">Delete</a></li>
     <li><a class="dropdown-item" href="#">Report</a></li>` : 
    `<li><a class="dropdown-item" href="#">Report</a></li>`;

        return `
        <div class="reply ms-5 mt-2">
            <div class="user-profile d-flex align-items-center">
                <a href="${replyProfileLink}" class="profile-link">
                    <img src="${reply.user_image}" class="rounded-circle me-2" width="32">
                </a>
                <div style="width: 100%;">
                    <div class="post-row">
                        <a href="/user-profile?user_id=${reply.user_id}" class="text-decoration-none" style="color: #000">
                            <h6 class="mb-0">${reply.user_fname} ${reply.user_lname}</h6>
                        </a>
                        <div class="dropdown" align="right">
                            <a href="#" class="text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fa fa-ellipsis-v"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                ${replyDropdownOptions}
                            </ul>
                        </div>
                    </div>
                    <small class="text-muted">${timeAgo(reply.timestamp_)}</small>
                </div>
            </div>
            <div class="post-row">
                <p class="mt-2 mb-0" style="padding: 0 0 0 55px" id="comment-text-${reply.comment_id}">${formattedReplyText}</p>
                <div class="comment-edit-form d-none" id="edit-form-${reply.comment_id}">
                    <textarea class="form-control mb-2" id="edit-text-${reply.comment_id}">${reply.comment_text}</textarea>
                    <button class="btn btn-sm btn-primary me-2" onclick="saveCommentEdit(${reply.comment_id})">Save</button>
                    <button class="btn btn-sm btn-secondary" onclick="cancelCommentEdit(${reply.comment_id})">Cancel</button>
                </div>
                <button style="background-color: #fff; border: none; font-size: 14px;" 
                    class="fontt" 
                    onclick="setReplyingTo(${reply.comment_id}, '${reply.user_fname}')">Reply</button>
            </div>
        </div>
        `;
    }).join('') : '';

    // Style @fname mentions in blue and link them using comment.user_id
    const formattedCommentText = comment.comment_text.replace(/@(\w+)/g, (match, fname) =>
        `<a href="/user-profile?user_id=${comment.user_id}" class="text-primary">@${fname}</a>`
    );

    return `
    <div class="comment" id="comment-${comment.comment_id}">
        <div class="user-profile d-flex align-items-center">
            <a href="${profileLink}" class="profile-link">
                <img src="${comment.user_image}" class="rounded-circle me-2" width="32">
            </a>
            <div style="width: 100%;">
                <div class="post-row">
                    <a href="/user-profile?user_id=${comment.user_id}" class="profile-link text-decoration-none" style="color: #000">
                        <h6 class="mb-0">${comment.user_fname} ${comment.user_lname}</h6>
                    </a>
                    <div class="dropdown" align="right">
                        <a href="#" class="text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa fa-ellipsis-v"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            ${commentDropdownOptions}
                        </ul>
                    </div>
                </div>
                <small class="text-muted">${timeAgo(comment.timestamp_)}</small>
            </div>
        </div>
        <div class="post-row">
            <p class="mt-2 mb-0" style="padding: 0 0 0 55px" id="comment-text-${comment.comment_id}">${formattedCommentText}</p>
            <div class="comment-edit-form d-none" id="edit-form-${comment.comment_id}">
                <textarea class="form-control mb-2" id="edit-text-${comment.comment_id}">${comment.comment_text}</textarea>
                <button class="btn btn-sm btn-primary me-2" onclick="saveCommentEdit(${comment.comment_id})">Save</button>
                <button class="btn btn-sm btn-secondary" onclick="cancelCommentEdit(${comment.comment_id})">Cancel</button>
            </div>
            <button style="background-color: #fff; border: none; font-size: 14px;" 
                class="fontt" 
                onclick="setReplyingTo(${comment.comment_id}, '${comment.user_fname}')">Reply</button>
        </div>
        ${repliesHTML}
    </div>
    `;
}

function setReplyingTo(commentId, userName) {
    replyingTo = commentId;
    updateCommentInput(userName);
    document.getElementById('commentInput').focus();
}

function updateCommentInput(userName) {
    const input = document.getElementById('commentInput');
    if (replyingTo !== null && userName) {
        input.value = `@${userName} `;
        input.selectionStart = input.selectionEnd = input.value.length;
    } else {
        input.value = '';
    }
}

async function postComment() {
    const commentInput = document.getElementById('commentInput');
    let commentText = commentInput.value.trim();
    if (!commentText || !currentPostId) return;
    try {
        const response = await fetch('/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blog_id: currentPostId,
                parent_comment_id: replyingTo || null,
                comment_text: commentText
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to post comment');
        }
        await loadComments(currentPostId);
        commentInput.value = '';
        replyingTo = null;
        const container = document.querySelector('.comments-container');
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Error posting comment: ' + error.message);
    }
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'h', seconds: 3600 },
        { label: 'm', seconds: 60 },
        { label: 's', seconds: 1 }
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count > 0) {
            return `${count}${interval.label}${count > 1 && interval.label.length > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}

document.getElementById('commentInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') postComment();
});

document.getElementById('canv2').addEventListener('hidden.bs.offcanvas', function () {
    currentPostId = null;
    replyingTo = null;
});

window.addEventListener('resize', function () {
    const offcanvas = document.getElementById('canv2');
    if (offcanvas.classList.contains('show')) {
        positionOffcanvas();
    }
});

function positionOffcanvas() {
    const offcanvas = document.getElementById('canv2');
    if (window.innerWidth <= 576) {
        offcanvas.style.left = '0';
        offcanvas.style.transform = 'none';
        offcanvas.style.width = '100%';
    } else {
        offcanvas.style.left = '50%';
        offcanvas.style.transform = 'translateX(-50%)';
        offcanvas.style.width = '700px';
    }
}

var commentOffcanvas = new bootstrap.Offcanvas(document.getElementById('canv2'));
document.getElementById('canv2').addEventListener('shown.bs.offcanvas', function () {
    positionOffcanvas();
    if (currentPostId) {
        loadComments(currentPostId);
    }
});

document.querySelectorAll('.post-date').forEach(el => {
    const dateStr = el.getAttribute('data-date');
    if (dateStr) {
        el.textContent = timeAgo(dateStr);
    }
});

// Function to modify post dropdown options based on ownership
function updatePostDropdownOptions(postId, ownerId) {
    const dropdown = document.querySelector(`#post-dropdown-${postId} .dropdown-menu`);
    if (dropdown && currentUserId === ownerId) {
        dropdown.innerHTML = `
            <li><a class="dropdown-item" href="#" onclick="editPost(${postId})">Edit</a></li>
            <li><a class="dropdown-item" href="#" onclick="deletePost(${postId})">Delete</a></li>
            <li><a class="dropdown-item" href="#">Report</a></li>
        `;
    }
}

// Functions for handling post edits and deletes
function editPost(postId) {
    // Redirect to edit post page or open edit modal
    window.location.href = `/edit-blog?id=${postId}`;
}



async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    try {
        const response = await fetch(`/blogs/${postId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete post');
        }
        
        // Redirect to blog list or reload page
        window.location.reload();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post: ' + error.message);
    }
}
