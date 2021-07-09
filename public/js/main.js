document.addEventListener('DOMContentLoaded', () => {
  const deleteBtns = document.querySelectorAll('.delete-btn');

  if (deleteBtns.length > 0) {
    deleteBtns.forEach(deleteBtn => deleteBtn.addEventListener('click', async () => {
      const postId = deleteBtn.parentNode.querySelector('[name=postId]').value;
      const csrf = deleteBtn.parentNode.querySelector('[name=_csrf]').value;

      const postElement = deleteBtn.closest('article');
      const backdropDiv = document.querySelector('.modal-backdrop');

      try {
        const res = await fetch('/posts/delete/' + postId, {
          method: 'DELETE',
          headers: { 'csrf-token': csrf }
        });
        const resData = await res.json();

        if (res.ok) {
          postElement.parentNode.removeChild(postElement);
          backdropDiv.parentNode.removeChild(backdropDiv);
          document.body.classList.remove('modal-open');
          document.body.style = "";
          document.querySelector('main').insertAdjacentHTML('beforebegin',
          `<div class="alert alert-secondary alert-dismissible fade show text-center w-75 mx-auto" role="alert">${resData.message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`
          );
        }
      } catch (err) {
        document.querySelector('main').insertAdjacentHTML('beforebegin',
          `<div class="alert alert-danger alert-dismissible fade show text-center w-75 mx-auto" role="alert">Something went wrong. Post can't be deleted.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`
        );
      }
    }))
  }
})
