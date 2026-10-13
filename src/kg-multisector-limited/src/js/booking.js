// This file contains the JavaScript functions related to the booking functionality. 
// It manages the booking process, including form validation and submission.

document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (validateForm()) {
                submitBooking();
            }
        });
    }

    function validateForm() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const date = document.getElementById('date').value;

        if (!name || !email || !date) {
            alert('Please fill in all fields.');
            return false;
        }

        // Additional validation can be added here

        return true;
    }

    function submitBooking() {
        const formData = new FormData(bookingForm);
        
        fetch('/api/book', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Booking successful!');
                bookingForm.reset();
            } else {
                alert('Booking failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        });
    }
});