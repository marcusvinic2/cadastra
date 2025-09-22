import { Showcase } from './showcase'

function main() {
  const api = 'http://localhost:5000/products';
  new Showcase(api);
}

document.addEventListener("DOMContentLoaded", main);
