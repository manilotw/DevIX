from django import forms

class ContactForm(forms.Form):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'placeholder': 'Введите ваш адрес электронной почты',
            'class': 'cta-input'
        })
    )
    message = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'placeholder': 'Сообщение',
            'rows': 4
        })
    )
    name = forms.CharField(
        required=False,
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Ваше имя'
        })
    )
