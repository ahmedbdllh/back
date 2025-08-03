export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return ''
  
  const cleaned = ('' + phoneNumber).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  
  return phoneNumber
}

export const truncateString = (str, num) => {
  if (!str) return ''
  if (str.length <= num) return str
  return str.slice(0, num) + '...'
}

export const capitalizeFirstLetter = (string) => {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}