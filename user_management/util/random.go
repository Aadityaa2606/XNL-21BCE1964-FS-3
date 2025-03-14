package util

import (
	"math/rand"
)

const alphabet = "abcdefghijklmnopqrstuvwxyz"

func RandomInt(min, max int64) int64 {
	return min + rand.Int63n(max-min+1)
}

// RandomString generates a random string of n characters
func RandomString(n int) string {
	var result string
	for i := 0; i < n; i++ {
		randomIndex := rand.Intn(len(alphabet))
		result += string(alphabet[randomIndex])
	}
	return result
}

// RandomOwner generates a random owner name
func RandomOwner() string {
	return RandomString(6)
}

// RandomMoney generates a random amount of money
func RandomMoney() int64 {
	return RandomInt(0, 1000)
}

// RandomCurrency generates a random currency code
func RandomCurrency() string {
	currencies := []string{"USD", "EUR", "CAD", "INR"}
	n := len(currencies)
	return currencies[rand.Intn(n)]
}

// RandomEmail generate a random email
func RandomEmail() string {
	return RandomString(6) + "@gmail.com"
}
