interface Product {
  id: string;
  name: string;
  price: number;
  parcelamento: Array<number>;
  color: string;
  image: string;
  size: Array<string>;
  date: string;
}

export class Showcase {
  private products: Product[] = [];
  private filteredProducts: Product[] = [];
  private displayedProducts: Product[] = [];
  private currentPage: number = 1;
  private itemsPerPage: number = 9;
  private filters = {
    colors: new Set<string>(),
    sizes: new Set<string>(),
    priceRanges: new Set<string>()
  };

  private cartCount: number = 0;
  private currentSort: string = 'default';

  private productsGrid!: HTMLElement;
  private loadMoreBtn!: HTMLElement;
  private filterModal!: HTMLElement;
  private sortModal!: HTMLElement;
  private sortSelect!: HTMLSelectElement;
  private cartIcon!: HTMLElement;

  constructor(private apiUrl: string) {
    this.init();
  }

  private async init() {
    await this.fetchProducts();
    this.initializeDOM();
    this.renderAllFilters();
    this.bindEvents();
    this.syncFilters();
    this.applyFiltersAndSort();
  }

  private renderAllFilters(): void {
    this.renderColorFilters();
    this.renderSizeFilters();
    this.renderPriceFilters();
  }

  private renderColorFilters(): void {
    const desktopContainer = document.querySelector('.color-filters');
    const mobileContainer = document.querySelector('.modal-filter-section__content');

    const colorsSet = new Set<string>();
    this.products.forEach(product => {
      if (product.color) {
        colorsSet.add(product.color);
      }
    });
    const colors = Array.from(colorsSet);

    desktopContainer.innerHTML = '';
    colors.forEach(color => {
      desktopContainer.appendChild(this.createFilterElement(color, 'color', 'color-filter', 'color-filter__label'));
    });

    mobileContainer.innerHTML = '';
    colors.forEach(color => {
      mobileContainer.appendChild(this.createFilterElement(color, 'mobile-color', 'modal-color-filter', 'modal-color-filter__label'));
    });
  }

  private renderSizeFilters(): void {
    const desktopContainer = document.querySelector('.size-filters');
    const mobileContainer = document.querySelector('.modal-size-filters');

    if (!desktopContainer || !mobileContainer) {
      console.error('Um dos containers de filtro de tamanho não foi encontrado.');
      return;
    }

    const sizesSet = new Set<string>();
    this.products.forEach(product => {
      product.size.forEach(size => sizesSet.add(size));
    });

    const sizes = Array.from(sizesSet).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });

    desktopContainer.innerHTML = '';
    sizes.forEach(size => {
      desktopContainer.appendChild(this.createFilterElement(size, 'size', 'size-filter', 'size-filter__label'));
    });

    mobileContainer.innerHTML = '';
    sizes.forEach(size => {
      mobileContainer.appendChild(this.createFilterElement(size, 'mobile-size', 'modal-size-filter', 'modal-size-filter__label'));
    });
  }

  private renderPriceFilters(): void {
    const priceRanges = [
      { value: '0-50', label: 'de R$0 até R$50' },
      { value: '51-150', label: 'de R$51 até R$150' },
      { value: '151-300', label: 'de R$151 até R$300' },
      { value: '301-500', label: 'de R$301 até R$500' },
      { value: '500+', label: 'a partir de R$500' },
    ];

    const desktopContainer = document.querySelector('.price-filters');
    const mobileContainer = document.querySelector('.modal-price-filters__content');

    if (!desktopContainer || !mobileContainer) {
      console.error('Um dos containers de filtro de preço não foi encontrado.');
      return;
    }

    desktopContainer.innerHTML = '';
    priceRanges.forEach(range => {
      desktopContainer.appendChild(
        this.createFilterElement(range.value, 'price', 'price-filter', 'price-filter__label', range.label)
      );
    });

    mobileContainer.innerHTML = '';
    priceRanges.forEach(range => {
      mobileContainer.appendChild(
        this.createFilterElement(range.value, 'mobile-price', 'modal-price-filter', 'modal-price-filter__label', range.label)
      );
    });
  }


  private createFilterElement(
    value: string,
    inputName: string,
    labelClass: string,
    spanClass: string,
    labelText?: string
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = labelClass;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = inputName;
    input.value = value;

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const filterKey = target.name.includes('color') ? 'colors'
        : target.name.includes('size') ? 'sizes'
          : 'priceRanges';

      if (target.checked) {
        this.filters[filterKey].add(target.value);
      } else {
        this.filters[filterKey].delete(target.value);
      }
      this.applyFiltersAndSort();
    });

    const labelSpan = document.createElement('span');
    labelSpan.className = spanClass;
    labelSpan.textContent = labelText || value; 

    label.appendChild(input);
    label.appendChild(labelSpan);
    return label;
  }


  private syncFilters(): void {
    document.querySelectorAll('input[name="color"], input[name="mobile-color"]').forEach(input => {
      const target = input as HTMLInputElement;
      target.checked = this.filters.colors.has(target.value);
    });

    document.querySelectorAll('input[name="size"], input[name="mobile-size"]').forEach(input => {
      const target = input as HTMLInputElement;
      target.checked = this.filters.sizes.has(target.value);
    });

    document.querySelectorAll('input[name="price"], input[name="mobile-price"]').forEach(input => {
      const target = input as HTMLInputElement;
      target.checked = this.filters.priceRanges.has(target.value);
    });
  }

  private async fetchProducts() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error('Erro ao buscar produtos da API');
      this.products = await response.json();
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.log(error);
      this.products = [];
      this.filteredProducts = [];
    }
  }

  private initializeDOM(): void {
    this.productsGrid = document.getElementById('productsGrid')!;
    this.loadMoreBtn = document.getElementById('loadMoreBtn')!;
    this.filterModal = document.getElementById('filterModal')!;
    this.sortModal = document.getElementById('sortModal')!;
    this.sortSelect = document.getElementById('sortSelect') as HTMLSelectElement;
    this.cartIcon = document.querySelector('.header__cart-icon')!;
  }

  private addToCart(): void {
    this.cartCount++;
    this.updateCartCount();
  }

  private updateCartCount(): void {
    if (!this.cartIcon) return;

    let counter = this.cartIcon.querySelector('.cart-counter') as HTMLElement;
    if (!counter) {
      counter = document.createElement('span');
      counter.className = 'cart-counter';
      this.cartIcon.appendChild(counter);
    }

    counter.textContent = this.cartCount.toString();
  }

  private bindEvents(): void {
    document.getElementById('filterBtn')?.addEventListener('click', () => {
      this.openFilterModal();
    });

    document.getElementById('sortBtn')?.addEventListener('click', () => {
      this.openSortModal();
    });

    const applyBtn = document.getElementById('applyFiltersBtn');
    applyBtn?.addEventListener('click', () => {
      this.applyFiltersAndSort();
      this.closeFilterModal();
    });

    // Ordenação mobile
    document.querySelectorAll<HTMLInputElement>('input[name="mobile-sort"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.currentSort = target.value; 
        this.applyFiltersAndSort();      
        this.closeSortModal();           
      });
    });

    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    document.getElementById('closeFilterModal')?.addEventListener('click', () => {
      this.closeFilterModal();
    });

    document.getElementById('closeSortModal')?.addEventListener('click', () => {
      this.closeSortModal();
    });

    this.filterModal.addEventListener('click', (e) => {
      if (e.target === this.filterModal) {
        this.closeFilterModal();
      }
    });

    this.sortModal.addEventListener('click', (e) => {
      if (e.target === this.sortModal) {
        this.closeSortModal();
      }
    });

    this.loadMoreBtn.addEventListener('click', () => {
      this.loadMore();
    });

    this.sortSelect.addEventListener('change', (e) => {
      this.currentSort = (e.target as HTMLSelectElement).value;
      this.applyFiltersAndSort();
    });

    this.bindModalAccordion();
  }

  private bindModalAccordion(): void {
    document.querySelectorAll('.modal-filter-section__header').forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling as HTMLElement;
        const isActive = header.classList.contains('active');

        document.querySelectorAll('.modal-filter-section__header').forEach(h => {
          h.classList.remove('active');
          const c = h.nextElementSibling as HTMLElement;
          c.classList.remove('active');
        });

        if (!isActive) {
          header.classList.add('active');
          content.classList.add('active');
        }
      });
    });

    const firstHeader = document.querySelector('.modal-filter-section__header');
    if (firstHeader) {
      firstHeader.classList.add('active');
      const firstContent = firstHeader.nextElementSibling as HTMLElement;
      firstContent.classList.add('active');
    }
  }

  private openFilterModal(): void {
    this.filterModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.syncFilters();
  }

  private closeFilterModal(): void {
    this.filterModal.classList.remove('active');
    document.body.style.overflow = '';
    this.syncFilters();
  }

  private closeModal(): void {
    const modal = document.getElementById('filterModal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  private clearFilters(): void {
    this.filters.colors.clear();
    this.filters.sizes.clear();
    this.filters.priceRanges.clear();

    const inputs = document.querySelectorAll<HTMLInputElement>('#filterModal input[type="checkbox"]');
    inputs.forEach(input => {
      input.checked = false;
    });

    this.applyFiltersAndSort();
    this.closeModal();
  }

  private openSortModal(): void {
    this.sortModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  private closeSortModal(): void {
    this.sortModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  private applyFiltersAndSort(): void {
    this.filteredProducts = this.products.filter(product => {
      if (this.filters.colors.size > 0 && !this.filters.colors.has(product.color)) {
        return false;
      }

      if (this.filters.sizes.size > 0) {
        const hasMatchingSize = product.size.some(size => this.filters.sizes.has(size));
        if (!hasMatchingSize) return false;
      }

      if (this.filters.priceRanges.size > 0) {
        const matchesPrice = Array.from(this.filters.priceRanges).some(range => {
          switch (range) {
            case '0-50':
              return product.price <= 50;
            case '51-150':
              return product.price > 50 && product.price <= 150;
            case '151-300':
              return product.price > 150 && product.price <= 300;
            case '301-500':
              return product.price > 300 && product.price <= 500;
            case '500+':
              return product.price > 500;
            default:
              return true;
          }
        });
        if (!matchesPrice) return false;
      }
      return true;
    });

    this.sortProducts();
    this.currentPage = 1;
    this.renderProducts();
  }

  private sortProducts(): void {
    switch (this.currentSort) {
      case 'newest':
        this.filteredProducts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:

        break;
    }
  }

  private renderProducts(): void {
    const startIndex = 0;
    const endIndex = this.currentPage * this.itemsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);

    this.productsGrid.innerHTML = '';

    this.displayedProducts.forEach((product, index) => {
      const productCard = this.createProductCard(product);
      productCard.style.animationDelay = `${index * 0.1}s`;
      productCard.classList.add('fade-in-up');
      this.productsGrid.appendChild(productCard);
    });

    const hasMoreProducts = endIndex < this.filteredProducts.length;
    this.loadMoreBtn.style.display = hasMoreProducts ? 'block' : 'none';
    (this.loadMoreBtn as HTMLButtonElement).disabled = !hasMoreProducts;
  }

  private createProductCard(product: Product): HTMLElement {
    const card = document.createElement('div');
    card.className = 'product-card';

    const installmentText = `até ${product.parcelamento[0]}x de R$ ${product.parcelamento[1].toFixed(2).replace('.', ',')}`;

    card.innerHTML = `
      <div class="product-card__image-container">
          <img src="${product.image}" alt="${product.name}" class="product-card__image" loading="lazy">
      </div>
      <div class="product-card__content">
          <h3 class="product-card__name">${product.name}</h3>
          <div class="product-card__price">R$ ${product.price.toFixed(2).replace('.', ',')}</div>
          <div class="product-card__installments">${installmentText}</div>
          <button class="product-card__button">COMPRAR</button>
      </div>
    `;

    const buyBtn = card.querySelector('.product-card__button') as HTMLButtonElement;
    buyBtn.addEventListener('click', () => this.addToCart());

    return card;
  }

  private loadMore(): void {
    this.currentPage++;
    this.renderProducts();
  }
}
