import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  try {
    console.log('Testing Resend API...')
    console.log('API Key present:', !!process.env.RESEND_API_KEY)
    console.log('API Key length:', process.env.RESEND_API_KEY?.length)

    const response = await resend.emails.send({
      from: 'TrueOddsIQ Test <picks@trueoddsiq.com>',
      to: 'td.pct55@gmail.com',
      subject: 'Resend API Test - April 30',
      html: `<html><body>
        <h2>Resend API Test</h2>
        <p>This is a test email from Resend API at ${new Date().toISOString()}</p>
        <p>If you received this, Resend is working.</p>
      </body></html>`
    })

    console.log('Resend response:', JSON.stringify(response, null, 2))
    
    return res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Resend error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
}
