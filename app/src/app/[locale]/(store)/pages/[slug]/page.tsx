import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import type { Metadata } from 'next';

/* ─── Page content database ──────────────────────────────────────────── */
type PageContent = {
  titleEs: string;
  titleEn: string;
  contentEs: React.ReactNode;
  contentEn: React.ReactNode;
};

const PAGES: Record<string, PageContent> = {
  envios: {
    titleEs: 'Envíos y Devoluciones',
    titleEn: 'Shipping & Returns',
    contentEs: (
      <>
        <section className="prose-section">
          <h2>🚚 Política de Envíos</h2>

          <h3>Área de cobertura</h3>
          <p>Realizamos entregas en toda Costa Rica. Nuestro servicio principal cubre el <strong>Gran Área Metropolitana (GAM)</strong> con tiempos de entrega más rápidos.</p>

          <h3>Tarifas y tiempos de entrega</h3>
          <table className="prose-table">
            <thead><tr><th>Zona</th><th>Costo</th><th>Tiempo estimado</th></tr></thead>
            <tbody>
              <tr><td>GAM (San José, Alajuela, Cartago, Heredia)</td><td>₡2,500</td><td>1–2 días hábiles</td></tr>
              <tr><td>Zona Central ampliada</td><td>₡4,500</td><td>2–3 días hábiles</td></tr>
              <tr><td>Guanacaste, Puntarenas, Limón</td><td>₡6,000</td><td>3–5 días hábiles</td></tr>
            </tbody>
          </table>

          <h3>Envío gratuito</h3>
          <p>Todos los pedidos <strong>mayores a ₡75,000</strong> dentro del GAM califican para <strong>envío gratuito</strong>.</p>

          <h3>Seguimiento de pedidos</h3>
          <p>Una vez confirmado tu pedido, te contactaremos por WhatsApp o correo electrónico con el número de seguimiento y los detalles de la entrega.</p>

          <h3>Entrega fallida</h3>
          <p>Si no hay nadie en la dirección al momento de la entrega, realizaremos un segundo intento al día hábil siguiente. Después de dos intentos fallidos, el pedido será devuelto a nuestro centro de distribución y nos pondremos en contacto para coordinar la reentrega.</p>
        </section>

        <section className="prose-section">
          <h2>🔄 Política de Devoluciones</h2>

          <h3>Plazo de devolución</h3>
          <p>Aceptamos devoluciones dentro de los <strong>30 días calendario</strong> a partir de la fecha de entrega.</p>

          <h3>Condiciones</h3>
          <ul>
            <li>El artículo debe estar en su estado original: sin usar, sin lavar, con todas las etiquetas originales.</li>
            <li>El artículo no debe haber sido alterado o personalizado.</li>
            <li>Debes presentar el número de pedido o el comprobante de compra.</li>
          </ul>

          <h3>Artículos no retornables</h3>
          <ul>
            <li>Artículos de temporada o en oferta final (marcados claramente en el sitio).</li>
            <li>Artículos de higiene personal (ropa interior, trajes de baño).</li>
            <li>Artículos personalizados a pedido.</li>
          </ul>

          <h3>Proceso de devolución</h3>
          <ol>
            <li>Contáctanos por WhatsApp o email dentro del plazo.</li>
            <li>Coordinaremos el retiro del artículo o te indicaremos la dirección de devolución.</li>
            <li>Una vez recibido e inspeccionado el artículo, procesaremos el reembolso en <strong>5–7 días hábiles</strong>.</li>
          </ol>

          <h3>Reembolsos</h3>
          <p>El reembolso se realizará a través del mismo método de pago original. Si pagaste con SINPE o transferencia, te pediremos los datos de tu cuenta para el depósito.</p>
        </section>

        <div className="prose-cta">
          <p>¿Tienes dudas sobre tu pedido?</p>
          <Link href="/es/pages/contacto" className="btn btn-primary">Contáctanos</Link>
        </div>
      </>
    ),
    contentEn: (
      <>
        <section className="prose-section">
          <h2>🚚 Shipping Policy</h2>

          <h3>Coverage area</h3>
          <p>We deliver throughout Costa Rica. Our primary service covers the <strong>Greater Metropolitan Area (GAM)</strong> with the fastest delivery times.</p>

          <h3>Rates & delivery times</h3>
          <table className="prose-table">
            <thead><tr><th>Zone</th><th>Cost</th><th>Estimated time</th></tr></thead>
            <tbody>
              <tr><td>GAM (San José, Alajuela, Cartago, Heredia)</td><td>₡2,500</td><td>1–2 business days</td></tr>
              <tr><td>Extended Central Zone</td><td>₡4,500</td><td>2–3 business days</td></tr>
              <tr><td>Guanacaste, Puntarenas, Limón</td><td>₡6,000</td><td>3–5 business days</td></tr>
            </tbody>
          </table>

          <h3>Free shipping</h3>
          <p>All orders <strong>over ₡75,000</strong> within the GAM qualify for <strong>free shipping</strong>.</p>

          <h3>Order tracking</h3>
          <p>Once your order is confirmed, we will contact you via WhatsApp or email with the tracking number and delivery details.</p>

          <h3>Failed delivery</h3>
          <p>If no one is home at delivery time, we will make a second attempt on the next business day. After two failed attempts, the order will be returned to our distribution center and we will reach out to reschedule.</p>
        </section>

        <section className="prose-section">
          <h2>🔄 Returns Policy</h2>

          <h3>Return window</h3>
          <p>We accept returns within <strong>30 calendar days</strong> from the delivery date.</p>

          <h3>Conditions</h3>
          <ul>
            <li>The item must be in its original condition: unworn, unwashed, with all original tags attached.</li>
            <li>The item must not have been altered or customized.</li>
            <li>You must provide your order number or proof of purchase.</li>
          </ul>

          <h3>Non-returnable items</h3>
          <ul>
            <li>Seasonal or final-sale items (clearly marked on the site).</li>
            <li>Personal hygiene items (underwear, swimwear).</li>
            <li>Custom-made or personalized items.</li>
          </ul>

          <h3>Return process</h3>
          <ol>
            <li>Contact us via WhatsApp or email within the return window.</li>
            <li>We will coordinate pickup or provide the return address.</li>
            <li>Once received and inspected, we will process your refund within <strong>5–7 business days</strong>.</li>
          </ol>

          <h3>Refunds</h3>
          <p>Refunds are issued to the original payment method. If you paid via SINPE or bank transfer, we will request your account details for the deposit.</p>
        </section>

        <div className="prose-cta">
          <p>Questions about your order?</p>
          <Link href="/en/pages/contacto" className="btn btn-primary">Contact us</Link>
        </div>
      </>
    ),
  },

  contacto: {
    titleEs: 'Contacto',
    titleEn: 'Contact',
    contentEs: (
      <>
        <section className="prose-section">
          <h2>💬 ¿Cómo podemos ayudarte?</h2>
          <p>Nuestro equipo está disponible para responder tus preguntas de <strong>lunes a sábado, 8am–8pm</strong> (hora de Costa Rica).</p>

          <div className="contact-cards">
            <a href="https://wa.me/50688888888" className="contact-card" target="_blank" rel="noopener noreferrer">
              <span className="contact-icon">📱</span>
              <div>
                <h3>WhatsApp</h3>
                <p>Respuesta en menos de 1 hora en horas hábiles.</p>
                <p className="contact-detail">+506 8888-8888</p>
              </div>
            </a>

            <a href="mailto:hola@cabox.store" className="contact-card">
              <span className="contact-icon">✉️</span>
              <div>
                <h3>Correo electrónico</h3>
                <p>Respondemos en menos de 24 horas hábiles.</p>
                <p className="contact-detail">hola@cabox.store</p>
              </div>
            </a>

            <div className="contact-card">
              <span className="contact-icon">📍</span>
              <div>
                <h3>Ubicación</h3>
                <p>Operamos desde San José, Costa Rica. Las entregas son coordinadas por zona.</p>
                <p className="contact-detail">San José, Costa Rica</p>
              </div>
            </div>
          </div>
        </section>

        <section className="prose-section">
          <h2>❓ Preguntas frecuentes</h2>
          <div className="faq-list">
            {[
              { q: '¿Cuánto tiempo tarda mi pedido en llegar?', a: 'En el GAM: 1–2 días hábiles. Resto del país: 3–5 días hábiles.' },
              { q: '¿Puedo cambiar o cancelar mi pedido?', a: 'Sí, siempre que el pedido no haya sido enviado. Contáctanos lo antes posible por WhatsApp.' },
              { q: '¿Cuáles son los métodos de pago aceptados?', a: 'Aceptamos SINPE Móvil, transferencia bancaria, tarjeta de crédito/débito (Stripe) y PayPal.' },
              { q: '¿Hacen envíos fuera de Costa Rica?', a: 'Por el momento solo enviamos dentro de Costa Rica. Estamos trabajando para habilitar envíos internacionales.' },
              { q: '¿Qué hago si recibí un artículo dañado?', a: 'Escríbenos por WhatsApp o email dentro de 48 horas con fotos del artículo. Lo resolvemos sin costo adicional.' },
            ].map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary className="faq-question">{q}</summary>
                <p className="faq-answer">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </>
    ),
    contentEn: (
      <>
        <section className="prose-section">
          <h2>💬 How can we help you?</h2>
          <p>Our team is available to answer your questions <strong>Monday to Saturday, 8am–8pm</strong> (Costa Rica time).</p>

          <div className="contact-cards">
            <a href="https://wa.me/50688888888" className="contact-card" target="_blank" rel="noopener noreferrer">
              <span className="contact-icon">📱</span>
              <div>
                <h3>WhatsApp</h3>
                <p>Response in under 1 hour during business hours.</p>
                <p className="contact-detail">+506 8888-8888</p>
              </div>
            </a>

            <a href="mailto:hola@cabox.store" className="contact-card">
              <span className="contact-icon">✉️</span>
              <div>
                <h3>Email</h3>
                <p>We respond within 24 business hours.</p>
                <p className="contact-detail">hola@cabox.store</p>
              </div>
            </a>

            <div className="contact-card">
              <span className="contact-icon">📍</span>
              <div>
                <h3>Location</h3>
                <p>We operate from San José, Costa Rica. Deliveries are coordinated by zone.</p>
                <p className="contact-detail">San José, Costa Rica</p>
              </div>
            </div>
          </div>
        </section>

        <section className="prose-section">
          <h2>❓ Frequently Asked Questions</h2>
          <div className="faq-list">
            {[
              { q: 'How long does delivery take?', a: 'GAM area: 1–2 business days. Rest of Costa Rica: 3–5 business days.' },
              { q: 'Can I change or cancel my order?', a: 'Yes, as long as the order has not shipped yet. Contact us as soon as possible via WhatsApp.' },
              { q: 'What payment methods do you accept?', a: 'We accept SINPE Móvil, bank transfer, credit/debit card (Stripe), and PayPal.' },
              { q: 'Do you ship outside Costa Rica?', a: 'Currently we only ship within Costa Rica. We are working on enabling international shipping.' },
              { q: 'What if I received a damaged item?', a: 'Message us via WhatsApp or email within 48 hours with photos. We will resolve it at no extra cost.' },
            ].map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary className="faq-question">{q}</summary>
                <p className="faq-answer">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </>
    ),
  },

  privacidad: {
    titleEs: 'Política de Privacidad',
    titleEn: 'Privacy Policy',
    contentEs: (
      <>
        <p className="prose-intro">Última actualización: marzo 2026</p>
        <section className="prose-section">
          <p>En <strong>Cabox</strong> respetamos y protegemos la privacidad de quienes visitan o realizan compras en nuestra tienda. Esta política describe cómo recopilamos, usamos y protegemos tu información personal, de conformidad con la <strong>Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley 8968)</strong> de Costa Rica.</p>

          <h2>1. Información que recopilamos</h2>
          <h3>Información que tú nos proporcionas</h3>
          <ul>
            <li>Nombre, apellidos y correo electrónico al crear una cuenta o realizar un pedido.</li>
            <li>Número de teléfono para coordinación de entregas.</li>
            <li>Dirección de envío (línea de dirección, ciudad, provincia).</li>
            <li>Información de pago (procesada de forma segura por Stripe o PayPal — nunca almacenamos datos de tarjeta).</li>
          </ul>
          <h3>Información recopilada automáticamente</h3>
          <ul>
            <li>Dirección IP y datos del navegador para fines de seguridad.</li>
            <li>Páginas visitadas y comportamiento de navegación anónimo (analytics).</li>
            <li>Cookies funcionales necesarias para el funcionamiento del carrito y la sesión.</li>
          </ul>

          <h2>2. Cómo usamos tu información</h2>
          <ul>
            <li><strong>Procesar y entregarte tus pedidos</strong> — nombre, dirección y teléfono son esenciales para la logística.</li>
            <li><strong>Comunicarnos contigo</strong> — confirmaciones de pedido, actualizaciones de envío, respuesta a consultas.</li>
            <li><strong>Mejorar nuestra tienda</strong> — análisis de navegación anónimo para optimizar la experiencia de usuario.</li>
            <li><strong>Cumplir obligaciones legales</strong> — registros de transacciones requeridos por la legislación costarricense.</li>
          </ul>
          <p>Nunca vendemos ni cedemos tu información personal a terceros con fines comerciales.</p>

          <h2>3. Compartir información con terceros</h2>
          <p>Solo compartimos información con proveedores necesarios para operar el servicio:</p>
          <ul>
            <li><strong>Proveedores de pago</strong> — Stripe, PayPal (sujetos a sus propias políticas de privacidad).</li>
            <li><strong>Proveedores de logística</strong> — para coordinar entregas, compartimos nombre, teléfono y dirección.</li>
            <li><strong>Herramientas analíticas</strong> — datos anonimizados para análisis de uso.</li>
          </ul>

          <h2>4. Seguridad de los datos</h2>
          <p>Implementamos medidas técnicas y organizativas para proteger tu información, incluyendo cifrado HTTPS, acceso restringido a bases de datos y almacenamiento seguro de contraseñas con hash bcrypt.</p>

          <h2>5. Tus derechos (Ley 8968)</h2>
          <p>Como titular de datos tienes derecho a: acceder a tu información, rectificarla, suprimirla y oponerte a su tratamiento. Para ejercer estos derechos, escríbenos a <a href="mailto:privacidad@cabox.store">privacidad@cabox.store</a>.</p>

          <h2>6. Retención de datos</h2>
          <p>Conservamos los datos de pedidos durante el tiempo exigido por la legislación fiscal costarricense (4 años). Los datos de cuenta se eliminan dentro de 30 días de recibir tu solicitud.</p>

          <h2>7. Cookies</h2>
          <p>Utilizamos cookies estrictamente necesarias (carrito de compras, sesión de autenticación) y cookies analíticas opcionales. Al continuar navegando aceptas el uso de cookies funcionales.</p>

          <h2>8. Cambios a esta política</h2>
          <p>Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos por correo electrónico o mediante un aviso destacado en el sitio.</p>

          <h2>9. Contacto</h2>
          <p>Para cualquier consulta sobre privacidad: <a href="mailto:privacidad@cabox.store">privacidad@cabox.store</a></p>
        </section>
      </>
    ),
    contentEn: (
      <>
        <p className="prose-intro">Last updated: March 2026</p>
        <section className="prose-section">
          <p>At <strong>Cabox</strong> we respect and protect the privacy of everyone who visits or shops at our store. This policy describes how we collect, use, and protect your personal information, in compliance with Costa Rica's <strong>Law for the Protection of Individuals regarding the Processing of their Personal Data (Law 8968)</strong>.</p>

          <h2>1. Information we collect</h2>
          <h3>Information you provide to us</h3>
          <ul>
            <li>Name, last name, and email when creating an account or placing an order.</li>
            <li>Phone number for delivery coordination.</li>
            <li>Shipping address (address line, city, province).</li>
            <li>Payment information (processed securely by Stripe or PayPal — we never store card data).</li>
          </ul>
          <h3>Automatically collected information</h3>
          <ul>
            <li>IP address and browser data for security purposes.</li>
            <li>Pages visited and anonymous browsing behavior (analytics).</li>
            <li>Functional cookies necessary for the cart and session.</li>
          </ul>

          <h2>2. How we use your information</h2>
          <ul>
            <li><strong>Process and deliver your orders</strong> — name, address, and phone are essential for logistics.</li>
            <li><strong>Communicate with you</strong> — order confirmations, shipping updates, responding to inquiries.</li>
            <li><strong>Improve our store</strong> — anonymous browsing analysis to optimize user experience.</li>
            <li><strong>Comply with legal obligations</strong> — transaction records required by Costa Rican law.</li>
          </ul>
          <p>We never sell or share your personal information with third parties for commercial purposes.</p>

          <h2>3. Sharing information with third parties</h2>
          <p>We only share information with providers necessary to operate the service:</p>
          <ul>
            <li><strong>Payment providers</strong> — Stripe, PayPal (subject to their own privacy policies).</li>
            <li><strong>Logistics providers</strong> — to coordinate deliveries, we share name, phone, and address.</li>
            <li><strong>Analytics tools</strong> — anonymized data for usage analysis.</li>
          </ul>

          <h2>4. Data security</h2>
          <p>We implement technical and organizational measures to protect your information, including HTTPS encryption, restricted database access, and secure bcrypt password hashing.</p>

          <h2>5. Your rights (Law 8968)</h2>
          <p>As a data subject you have the right to access, correct, delete, and object to the processing of your data. To exercise these rights, write to us at <a href="mailto:privacidad@cabox.store">privacidad@cabox.store</a>.</p>

          <h2>6. Data retention</h2>
          <p>We retain order data for the period required by Costa Rican tax law (4 years). Account data is deleted within 30 days of receiving your request.</p>

          <h2>7. Cookies</h2>
          <p>We use strictly necessary cookies (shopping cart, authentication session) and optional analytics cookies. By continuing to browse you accept the use of functional cookies.</p>

          <h2>8. Changes to this policy</h2>
          <p>We may update this policy occasionally. We will notify you of significant changes by email or via a prominent notice on the site.</p>

          <h2>9. Contact</h2>
          <p>For any privacy-related questions: <a href="mailto:privacidad@cabox.store">privacidad@cabox.store</a></p>
        </section>
      </>
    ),
  },

  terminos: {
    titleEs: 'Términos y Condiciones',
    titleEn: 'Terms & Conditions',
    contentEs: (
      <>
        <p className="prose-intro">Última actualización: marzo 2026</p>
        <section className="prose-section">
          <p>Al acceder y utilizar el sitio web de <strong>Cabox</strong> (cabox.store), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro servicio.</p>

          <h2>1. Sobre Cabox</h2>
          <p>Cabox es una tienda de moda en línea operada desde Costa Rica. Vendemos ropa y accesorios curados para el mercado costarricense.</p>

          <h2>2. Uso del sitio</h2>
          <ul>
            <li>Debes tener al menos 18 años para realizar compras o proporcionar información de pago válida de un adulto responsable.</li>
            <li>No debes usar el sitio para ningún propósito ilegal o no autorizado.</li>
            <li>No debes transmitir ningún código malicioso, virus o agente dañino.</li>
            <li>Nos reservamos el derecho de suspender o cancelar cuentas que violen estas condiciones.</li>
          </ul>

          <h2>3. Productos y precios</h2>
          <ul>
            <li>Nos esforzamos por mostrar los colores y descripciones de los productos con la mayor precisión posible. Sin embargo, no garantizamos que la representación en pantalla sea exactamente igual al producto físico.</li>
            <li>Los precios están en Colones Costarricenses (₡) salvo que se indique lo contrario.</li>
            <li>Nos reservamos el derecho de modificar precios en cualquier momento sin previo aviso. Los pedidos ya confirmados no se ven afectados por cambios de precio posteriores.</li>
            <li>Podemos limitar las cantidades disponibles por producto y por cliente.</li>
          </ul>

          <h2>4. Pedidos y contratos</h2>
          <p>Al realizar un pedido, recibirás un correo de confirmación. Este correo es un acuse de recibo, no una confirmación de contrato. El contrato de compraventa se perfecciona cuando confirmamos el pedido y este está listo para envío.</p>
          <p>Nos reservamos el derecho de rechazar o cancelar pedidos en casos de error de precio, producto agotado, o indicios de fraude.</p>

          <h2>5. Métodos de pago</h2>
          <p>Aceptamos los siguientes métodos de pago: SINPE Móvil, transferencia bancaria, Stripe (tarjeta) y PayPal. Todos los pagos con tarjeta son procesados por Stripe bajo PCI-DSS. No almacenamos datos de tarjeta en nuestros servidores.</p>

          <h2>6. Envíos</h2>
          <p>Consulta nuestra <Link href="/es/pages/envios">Política de Envíos y Devoluciones</Link> para información completa sobre tarifas, tiempos y condiciones.</p>

          <h2>7. Devoluciones y reembolsos</h2>
          <p>Consulta nuestra <Link href="/es/pages/envios">Política de Envíos y Devoluciones</Link> para información completa sobre el proceso de devolución.</p>

          <h2>8. Propiedad intelectual</h2>
          <p>Todo el contenido del sitio (imágenes, textos, logotipos, diseño) es propiedad de Cabox o sus licenciantes y está protegido por derechos de autor. No puedes reproducir, distribuir o crear obras derivadas sin autorización escrita.</p>

          <h2>9. Limitación de responsabilidad</h2>
          <p>Cabox no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del sitio o de los productos. Nuestra responsabilidad máxima no excederá el valor del pedido en disputa.</p>

          <h2>10. Ley aplicable</h2>
          <p>Estos términos se rigen por las leyes de la <strong>República de Costa Rica</strong>. Cualquier disputa será sometida a la jurisdicción de los tribunales de San José, Costa Rica.</p>

          <h2>11. Cambios a los términos</h2>
          <p>Podemos actualizar estos términos ocasionalmente. Los cambios entran en vigor al publicarse en el sitio. El uso continuado del sitio después de su publicación constituye aceptación de los nuevos términos.</p>

          <h2>12. Contacto</h2>
          <p>Para consultas sobre estos términos: <a href="mailto:hola@cabox.store">hola@cabox.store</a></p>
        </section>
      </>
    ),
    contentEn: (
      <>
        <p className="prose-intro">Last updated: March 2026</p>
        <section className="prose-section">
          <p>By accessing and using the <strong>Cabox</strong> website (cabox.store), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you must not use our service.</p>

          <h2>1. About Cabox</h2>
          <p>Cabox is an online fashion store operated from Costa Rica. We sell curated clothing and accessories for the Costa Rican market.</p>

          <h2>2. Use of the site</h2>
          <ul>
            <li>You must be at least 18 years old to make purchases, or provide valid payment information from a responsible adult.</li>
            <li>You must not use the site for any illegal or unauthorized purpose.</li>
            <li>You must not transmit any malicious code, viruses, or harmful agents.</li>
            <li>We reserve the right to suspend or cancel accounts that violate these conditions.</li>
          </ul>

          <h2>3. Products and prices</h2>
          <ul>
            <li>We strive to display product colors and descriptions as accurately as possible. However, we cannot guarantee that on-screen representations are exactly identical to the physical product.</li>
            <li>Prices are in Costa Rican Colones (₡) unless otherwise stated.</li>
            <li>We reserve the right to modify prices at any time without prior notice. Already confirmed orders are not affected by subsequent price changes.</li>
            <li>We may limit quantities available per product and per customer.</li>
          </ul>

          <h2>4. Orders and contracts</h2>
          <p>When you place an order, you will receive a confirmation email. This email is an acknowledgment of receipt, not a confirmation of contract. The purchase contract is formed when we confirm the order and it is ready for shipping.</p>
          <p>We reserve the right to refuse or cancel orders in cases of pricing error, out-of-stock products, or indications of fraud.</p>

          <h2>5. Payment methods</h2>
          <p>We accept the following payment methods: SINPE Móvil, bank transfer, Stripe (card), and PayPal. All card payments are processed by Stripe under PCI-DSS. We do not store card data on our servers.</p>

          <h2>6. Shipping</h2>
          <p>Please see our <Link href="/en/pages/envios">Shipping & Returns Policy</Link> for complete information on rates, timelines, and conditions.</p>

          <h2>7. Returns and refunds</h2>
          <p>Please see our <Link href="/en/pages/envios">Shipping & Returns Policy</Link> for complete information about the return process.</p>

          <h2>8. Intellectual property</h2>
          <p>All site content (images, text, logos, design) is the property of Cabox or its licensors and is protected by copyright. You may not reproduce, distribute, or create derivative works without written authorization.</p>

          <h2>9. Limitation of liability</h2>
          <p>Cabox will not be liable for indirect, incidental, or consequential damages arising from the use of the site or products. Our maximum liability will not exceed the value of the disputed order.</p>

          <h2>10. Governing law</h2>
          <p>These terms are governed by the laws of the <strong>Republic of Costa Rica</strong>. Any dispute will be submitted to the jurisdiction of the courts of San José, Costa Rica.</p>

          <h2>11. Changes to terms</h2>
          <p>We may update these terms occasionally. Changes take effect upon publication on the site. Continued use of the site after publication constitutes acceptance of the new terms.</p>

          <h2>12. Contact</h2>
          <p>For questions about these terms: <a href="mailto:hola@cabox.store">hola@cabox.store</a></p>
        </section>
      </>
    ),
  },
};

/* ─── Metadata ────────────────────────────────────────────────────────── */
interface Props { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = PAGES[slug];
  if (!page) return { title: 'Cabox' };
  const title = locale === 'es' ? page.titleEs : page.titleEn;
  return { title: `${title} — Cabox` };
}

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

/* ─── Page component ──────────────────────────────────────────────────── */
export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const page = PAGES[slug];
  if (!page) notFound();

  const title = locale === 'es' ? page.titleEs : page.titleEn;
  const content = locale === 'es' ? page.contentEs : page.contentEn;

  return (
    <>
      <div className="page-hero" style={{ paddingBlock: '2.5rem' }}>
        <div className="container">
          <h1>{title}</h1>
        </div>
      </div>

      <div className="container prose-page">
        <article className="prose-article">
          {content}
        </article>
      </div>
    </>
  );
}
