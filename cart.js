// Get cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Elements
const cartGrid = document.getElementById("cart-grid");
const totalItemsEl = document.getElementById("total-items");
const subtotalEl = document.getElementById("subtotal");

// Render cart items
function renderCart() {
  cartGrid.innerHTML = "";
  let totalItems = 0;
  let subtotal = 0;

  if (cart.length === 0) {
    cartGrid.innerHTML = "<p>Your cart is empty!</p>";
  }

  cart.forEach((item) => {
    totalItems += item.qty;
    subtotal += item.qty * item.price;

    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-details">
                <h3>${item.name}</h3>
                <p>Price: $${item.price.toFixed(2)}</p>
                <div class="cart-actions">
                    <label>Qty: <input type="number" min="1" value="${
                      item.qty
                    }" data-id="${item.id}"></label>
                    <button data-id="${item.id}">Remove</button>
                </div>
            </div>
        `;
    cartGrid.appendChild(itemEl);
  });

  totalItemsEl.textContent = totalItems;
  subtotalEl.textContent = subtotal.toFixed(2);
  localStorage.setItem("cart", JSON.stringify(cart)); // Save
}

// Update quantity
cartGrid.addEventListener("input", (e) => {
  if (e.target.tagName === "INPUT") {
    const id = parseInt(e.target.dataset.id);
    const item = cart.find((i) => i.id === id);
    item.qty = parseInt(e.target.value);
    renderCart();
  }
});

// Remove item
cartGrid.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const id = parseInt(e.target.dataset.id);
    cart = cart.filter((i) => i.id !== id);
    renderCart();
  }
});

// Checkout button
document.getElementById("checkout-btn").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
  } else {
    alert("Thank you for your purchase! Total: $" + subtotalEl.textContent);
    cart = [];
    renderCart();
  }
});

// Initial render
renderCart();
