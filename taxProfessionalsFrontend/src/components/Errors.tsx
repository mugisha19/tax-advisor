import React from 'react'

interface ErrorsProps {
  message?: string
}

const Errors: React.FC<ErrorsProps> = ({ message }) => {
  if (!message) return null
  return (
    <p className="text-red-500 text-sm mb-1">{message}</p>
  )
}

export default Errors
