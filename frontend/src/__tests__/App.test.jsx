import { render, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import StoreContextMockProvider from './StoreContextMock';

describe('App Component', () => {

  test('renders navbar', () => {
    const { container } = render(
      <StoreContextMockProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StoreContextMockProvider>
    );

    const navbar = container.querySelector('.navbar');
    expect(navbar).toBeInTheDocument();
  });

  test('navigates to cart page', () => {
    const { container } = render(
      <StoreContextMockProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StoreContextMockProvider>
    );

    const cartLink = container.querySelector('a[href="/cart"]');
    fireEvent.click(cartLink);

    expect(window.location.pathname).toBe('/cart');
  });

});
