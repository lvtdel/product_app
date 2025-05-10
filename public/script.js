// Tải tất cả sản phẩm khi mở trang
async function loadAllProducts() {
    const response = await fetch('/products');
    const data = await response.json();

    const allProductsList = document.getElementById('allProductsList');
    allProductsList.innerHTML = '';

    if (data.length > 0) {
        data.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price}</td>
                <td>${product.description || 'N/A'}</td>
                <td>
                    <button class="edit-btn" onclick="editProduct(${product.id}, '${product.name}', ${product.price}, '${product.description || ''}')">Edit</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
                
            `;
            allProductsList.appendChild(tr);
        });
    } else {
        allProductsList.innerHTML = '<tr><td colspan="5">No products found</td></tr>';
    }
}

async function addProduct() {
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;

    const response = await fetch('/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, price, description }),
    });

    if (response.ok) {
        alert('Product added successfully!');
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDescription').value = '';
        loadAllProducts(); // Cập nhật bảng bên trái
        searchProducts();  // Cập nhật danh sách tìm kiếm
        loadProductCount(); // 👉 Cập nhật tổng số sản phẩm
    } else {
        alert('Error adding product');
    }

}

async function searchProducts() {
    const name = document.getElementById('searchName').value;
    const response = await fetch(`/products?name=${name}`);
    const data = await response.json();

    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    if (data.length > 0) {
        data.forEach(product => {
            const li = document.createElement('li');
            li.textContent = `ID: ${product.id}, Name: ${product.name}, Price: $${product.price}, Description: ${product.description || 'N/A'}`;
            productList.appendChild(li);
        });
    } else {
        productList.innerHTML = '<li>No products found</li>';
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const response = await fetch(`/products/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Product deleted successfully!');
            loadAllProducts(); // Cập nhật bảng
            searchProducts();  // Cập nhật danh sách tìm kiếm
            loadProductCount(); // 👉 Cập nhật tổng số sản phẩm
        } else {
            alert('Error deleting product');
        }

    }
}

function editProduct(id, name, price, description) {
    document.getElementById('editProductId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editPrice').value = price;
    document.getElementById('editDescription').value = description;
    document.getElementById('editModal').style.display = 'block';
}

async function saveEdit() {
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('editName').value;
    const price = document.getElementById('editPrice').value;
    const description = document.getElementById('editDescription').value;

    const response = await fetch(`/products/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, price, description }),
    });

    if (response.ok) {
        alert('Product updated successfully!');
        closeModal();
        loadAllProducts(); // Cập nhật bảng
        searchProducts(); // Cập nhật danh sách tìm kiếm
    } else {
        alert('Error updating product');
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

function loadProductCount() {
    fetch('/products/count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('productCount').textContent = `Total: ${data.totalProducts}`;
        })
        .catch(error => {
            console.error('Error fetching product count:', error);
            document.getElementById('productCount').textContent = 'Total: N/A';
        });
}


// Gọi hàm khi trang tải
window.onload = () => {
    loadAllProducts();
    loadProductCount();
};
