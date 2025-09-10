import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react"

export default function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Entre em Contato</h1>
              <p className="text-xl text-muted-foreground">
                Tem alguma dúvida, sugestão ou quer colaborar conosco? Adoraríamos ouvir de você!
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form and Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Envie sua Mensagem</CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e entraremos em contato o mais breve possível.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" placeholder="Seu nome completo" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o assunto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="duvida">Dúvida sobre Conteúdo</SelectItem>
                        <SelectItem value="sugestao">Sugestão de Artigo</SelectItem>
                        <SelectItem value="colaboracao">Proposta de Colaboração</SelectItem>
                        <SelectItem value="imprensa">Imprensa</SelectItem>
                        <SelectItem value="tecnico">Problema Técnico</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Mensagem</Label>
                    <Textarea id="mensagem" placeholder="Escreva sua mensagem aqui..." className="min-h-[120px]" />
                  </div>

                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensagem
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                    <CardDescription>Outras formas de entrar em contato conosco</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Email</h3>
                        <p className="text-muted-foreground">contato@eventoshistoricos.com.br</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Phone className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Telefone</h3>
                        <p className="text-muted-foreground">+55 (11) 9999-9999</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Endereço</h3>
                        <p className="text-muted-foreground">São Paulo, SP - Brasil</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Horário de Atendimento</h3>
                        <p className="text-muted-foreground">Segunda a Sexta: 9h às 18h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Colabore Conosco</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Você é historiador, jornalista ou especialista em geopolítica? Adoraríamos conhecer seu trabalho e
                      discutir possíveis colaborações.
                    </p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Saiba Mais sobre Colaborações
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
