(function () {
  'use strict';
  var raiz = document.documentElement;
  raiz.classList.add('js');
  var botao = document.querySelector('.navegacao__botao');
  var lista = document.getElementById('menu-links');
  if (botao && lista) {
    botao.hidden = false;
    var definir = function (aberto, devolverFoco) {
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      lista.classList.toggle('aberto', aberto);
      if (!aberto && devolverFoco) botao.focus();
    };
    botao.addEventListener('click', function () {
      definir(botao.getAttribute('aria-expanded') !== 'true', false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') definir(false, true);
    });
    lista.addEventListener('click', function (e) {
      if (e.target.closest('a')) definir(false, false);
    });
    var largo = window.matchMedia('(min-width: 600px)');
    if (largo.addEventListener) {
      largo.addEventListener('change', function (e) { if (e.matches) definir(false, false); });
    }
  }
  var cobrir = function (botao, x, y) {
    var r = botao.getBoundingClientRect();
    var d = 2 * Math.max(Math.hypot(x, y), Math.hypot(r.width - x, y), Math.hypot(x, r.height - y), Math.hypot(r.width - x, r.height - y));
    botao.style.setProperty('--origem-x', x + 'px');
    botao.style.setProperty('--origem-y', y + 'px');
    botao.style.setProperty('--diametro', Math.ceil(d) + 2 + 'px');
  };
  document.querySelectorAll('.botao, .bloco').forEach(function (botao) {
    var peloPonteiro = function (e) {
      var r = botao.getBoundingClientRect();
      cobrir(botao, e.clientX - r.left, e.clientY - r.top);
    };
    botao.addEventListener('pointerenter', peloPonteiro);
    botao.addEventListener('pointerdown', peloPonteiro);
    botao.addEventListener('touchstart', function () {}, { passive: true });
    botao.addEventListener('focus', function () {
      if (!botao.matches(':focus-visible')) return;
      var r = botao.getBoundingClientRect();
      cobrir(botao, r.width / 2, r.height / 2);
    });
  });
  var imas = document.querySelector('.imas');
  if (imas) {
    var linhas = [];
    for (var k = 0; k < 64; k++) {
      linhas.push(imas.appendChild(document.createElement('span')));
    }
    var comCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (comCursor && !semMovimento) {
      var angulos = linhas.map(function () { return 0; });
      var cursor = null;
      var aguardando = false;
      var girar = function () {
        aguardando = false;
        if (!cursor || imas.offsetParent === null) return;
        var caixa = imas.getBoundingClientRect();
        if (caixa.bottom < 0 || caixa.top > window.innerHeight) return;
        linhas.forEach(function (linha, i) {
          var cx = caixa.left + (i % 8 + 0.5) * caixa.width / 8;
          var cy = caixa.top + (Math.floor(i / 8) + 0.5) * caixa.height / 8;
          var alvo = Math.atan2(cursor.y - cy, cursor.x - cx) * 180 / Math.PI;
          alvo += 180 * Math.round((angulos[i] - alvo) / 180);
          angulos[i] = alvo;
          linha.style.transform = 'rotate(' + alvo.toFixed(1) + 'deg)';
        });
      };
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        cursor = { x: e.clientX, y: e.clientY };
        if (!aguardando) {
          aguardando = true;
          requestAnimationFrame(girar);
        }
      }, { passive: true });
    }
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var altura = window.innerHeight;
  var abaixoDaTela = function (el) { return el.getBoundingClientRect().top > altura; };
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.remove('a-revelar', 'fio-oculto');
      observador.unobserve(entrada.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.cabecalho-secao, .faixa__cabecalho').forEach(function (grupo) {
    if (!abaixoDaTela(grupo)) return;
    grupo.querySelectorAll('[data-revelar]').forEach(function (el, i) {
      el.classList.add('a-revelar', 'revelar-transicao');
      el.style.transitionDelay = (i * 80) + 'ms';
      observador.observe(el);
    });
  });
  document.querySelectorAll('.fio-secao').forEach(function (fio) {
    if (!abaixoDaTela(fio)) return;
    fio.classList.add('fio-oculto', 'fio-transicao');
    observador.observe(fio);
  });
  var grupos = [];
  document.querySelectorAll('.hero__titulo, .faixa__titulo, .titulo-secao, .texto-titulo').forEach(function (titulo) {
    var nos = [];
    var andar = document.createTreeWalker(titulo, NodeFilter.SHOW_TEXT);
    while (andar.nextNode()) nos.push(andar.currentNode);
    var palavras = [];
    nos.forEach(function (no) {
      var fragmento = document.createDocumentFragment();
      no.nodeValue.split(/(\s+)/).forEach(function (parte) {
        if (!parte) return;
        if (/^\s+$/.test(parte)) { fragmento.appendChild(document.createTextNode(parte)); return; }
        var palavra = document.createElement('span');
        palavra.className = 'palavra';
        palavra.textContent = parte;
        fragmento.appendChild(palavra);
        palavras.push(palavra);
      });
      no.parentNode.replaceChild(fragmento, no);
    });
    titulo.classList.add('titulo-palavras');
    grupos.push({ titulo: titulo, palavras: palavras, maximo: -1 });
  });
  var pendente = false;
  var agendar = function () {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(acender);
  };
  var acender = function () {
    pendente = false;
    var alturaTela = window.innerHeight;
    grupos = grupos.filter(function (g) {
      var topo = g.titulo.getBoundingClientRect().top;
      var progresso = Math.min(1, Math.max(0, (alturaTela - topo) / (alturaTela * 0.5)));
      if (progresso > g.maximo) {
        g.maximo = progresso;
        var n = g.palavras.length;
        g.palavras.forEach(function (palavra, i) {
          palavra.style.setProperty('--acesa', Math.min(1, Math.max(0, progresso * n - i)).toFixed(3));
        });
      }
      return g.maximo < 1;
    });
    if (!grupos.length) {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
    }
  };
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  acender();
})();
