// Simple JS for form validation or interactions

document.addEventListener('DOMContentLoaded', function() {
  // Add any client-side validation or interactions here
  console.log('Site d\'annonces loaded');

  // Hamburger menu functionality
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Like functionality
  const likeBtn = document.getElementById('like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async function() {
      const annonceId = window.location.pathname.split('/').pop();
      try {
        const response = await fetch(`/like/${annonceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          likeBtn.textContent = `❤️ ${data.likes} Like${data.likes !== 1 ? 's' : ''}`;
          likeBtn.classList.toggle('liked', data.isLiked);
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Erreur lors du like');
      }
    });
  }

  // Comment functionality
  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const annonceId = window.location.pathname.split('/').pop();
      const text = document.getElementById('comment-text').value.trim();

      if (!text) return;

      try {
        const response = await fetch(`/comment/${annonceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();
        if (response.ok) {
          // Add new comment to the list
          const commentsList = document.getElementById('comments-list');
          const commentDiv = document.createElement('div');
          commentDiv.className = 'comment';
          commentDiv.innerHTML = `
            <strong>${data.comment.user.name}</strong>
            <p>${data.comment.text}</p>
            <small>${new Date(data.comment.createdAt).toLocaleString()}</small>
          `;
          commentsList.appendChild(commentDiv);

          // Clear the form
          document.getElementById('comment-text').value = '';
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Erreur lors de l\'ajout du commentaire');
      }
    });
  }
});
