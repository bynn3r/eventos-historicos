import type { Metadata } from "next"
import { Shield, Eye, Lock, Users, FileText, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Política de Privacidade | Eventos Históricos",
  description: "Saiba como coletamos, usamos e protegemos suas informações pessoais no Eventos Históricos.",
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Política de Privacidade</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sua privacidade é fundamental para nós. Saiba como coletamos, usamos e protegemos suas informações
              pessoais.
            </p>
            <div className="mt-6 text-sm text-muted-foreground">Última atualização: Janeiro de 2024</div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Introdução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Introdução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  O Eventos Históricos está comprometido em proteger sua privacidade e dados pessoais. Esta política
                  explica como coletamos, usamos, armazenamos e protegemos suas informações quando você visita nosso
                  site ou utiliza nossos serviços.
                </p>
                <p className="text-muted-foreground">
                  Ao usar nosso site, você concorda com as práticas descritas nesta política de privacidade.
                </p>
              </CardContent>
            </Card>

            {/* Informações Coletadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Informações que Coletamos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações Fornecidas Voluntariamente</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Nome e endereço de email (formulário de contato e newsletter)</li>
                    <li>Mensagens e comentários enviados através de formulários</li>
                    <li>Preferências de conteúdo e configurações do usuário</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Informações Coletadas Automaticamente</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Endereço IP e informações do dispositivo</li>
                    <li>Tipo de navegador e sistema operacional</li>
                    <li>Páginas visitadas e tempo de permanência</li>
                    <li>Referências de sites que direcionaram você ao nosso site</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Como Usamos as Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Como Usamos suas Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Fornecer e melhorar nossos serviços e conteúdo</li>
                  <li>Responder às suas perguntas e solicitações</li>
                  <li>Enviar newsletters e atualizações (apenas com seu consentimento)</li>
                  <li>Analisar o uso do site para melhorar a experiência do usuário</li>
                  <li>Detectar e prevenir atividades fraudulentas ou maliciosas</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                </ul>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Cookies e Tecnologias Similares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência em nosso site:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cookies Essenciais</h4>
                    <p className="text-sm text-muted-foreground">
                      Necessários para o funcionamento básico do site, como preferências de tema e configurações.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cookies Analíticos</h4>
                    <p className="text-sm text-muted-foreground">
                      Nos ajudam a entender como os visitantes interagem com o site para melhorar a experiência.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proteção de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Proteção de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Criptografia SSL/TLS para transmissão de dados</li>
                  <li>Acesso restrito às informações pessoais</li>
                  <li>Monitoramento regular de segurança</li>
                  <li>Backup seguro e recuperação de dados</li>
                  <li>Treinamento da equipe sobre proteção de dados</li>
                </ul>
              </CardContent>
            </Card>

            {/* Seus Direitos */}
            <Card>
              <CardHeader>
                <CardTitle>Seus Direitos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Você tem os seguintes direitos em relação aos seus dados:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Acesso aos seus dados pessoais</li>
                    <li>Correção de informações incorretas</li>
                    <li>Exclusão de seus dados</li>
                  </ul>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Portabilidade dos dados</li>
                    <li>Oposição ao processamento</li>
                    <li>Retirada do consentimento</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Compartilhamento */}
            <Card>
              <CardHeader>
                <CardTitle>Compartilhamento de Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Com seu consentimento explícito</li>
                  <li>Para cumprir obrigações legais</li>
                  <li>Para proteger nossos direitos e segurança</li>
                  <li>Com prestadores de serviços confiáveis (sob acordos de confidencialidade)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Retenção de Dados */}
            <Card>
              <CardHeader>
                <CardTitle>Retenção de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos
                  nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
                </p>
              </CardContent>
            </Card>

            {/* Alterações */}
            <Card>
              <CardHeader>
                <CardTitle>Alterações nesta Política</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Podemos atualizar esta política de privacidade periodicamente. Notificaremos sobre mudanças
                  significativas através do site ou por email. Recomendamos que você revise esta política regularmente.
                </p>
              </CardContent>
            </Card>

            <Separator />

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Entre em Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Se você tiver dúvidas sobre esta política de privacidade ou sobre como tratamos seus dados, entre em
                  contato conosco:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-semibold">Eventos Históricos</p>
                  <p className="text-muted-foreground">Email: privacidade@eventoshistoricos.com</p>
                  <p className="text-muted-foreground">Telefone: (11) 1234-5678</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
