function toggleMode() {
  const body = document.querySelector('body');
  const button = document.querySelector('button');
  
  if (body.style.backgroundColor === 'rgb(255, 255, 255)') {
    body.style.backgroundColor = '#333';
    body.style.color = '#fff';
    button.style.backgroundColor = '#fff';
    button.style.color = '#333';
  } else {
    body.style.backgroundColor = '#fff';
    body.style.color = '#000';
    button.style.backgroundColor = '#333';
    button.style.color = '#fff';
  }
}